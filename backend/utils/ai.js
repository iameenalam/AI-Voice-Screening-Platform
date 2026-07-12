import OpenAI from 'openai';

// Default to a current, cheap model that reliably supports JSON mode.
// Override with AI_MODEL. (Fixes: weak/outdated gpt-3.5-turbo default.)
export const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';

const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 25000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);

// Lazy singleton OpenAI client pointed at OpenRouter.
let cachedClient = null;
let cachedKey = null;

export function getAIClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  if (cachedClient && cachedKey === apiKey) return cachedClient;

  cachedKey = apiKey;
  cachedClient = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
    defaultHeaders: {
      'HTTP-Referer': 'https://vocalent.com',
      'X-Title': 'Vocalent',
    },
  });
  return cachedClient;
}

export function isAIConfigured() {
  return !!process.env.OPENROUTER_API_KEY;
}

// --- Cost / token accounting -------------------------------------------------

// Approximate USD price per 1M tokens, used ONLY when the provider does not
// return an actual cost. Extend/override via AI_PRICING_JSON, a JSON object of
// { "<model>": { "in": <usd per 1M>, "out": <usd per 1M> } }.
const DEFAULT_PRICING = {
  'openai/gpt-4o-mini': { in: 0.15, out: 0.6 },
  'openai/gpt-4o': { in: 2.5, out: 10 },
  'openai/gpt-4.1-mini': { in: 0.4, out: 1.6 },
  'openai/gpt-3.5-turbo': { in: 0.5, out: 1.5 },
};

const PRICING = (() => {
  try {
    const override = process.env.AI_PRICING_JSON ? JSON.parse(process.env.AI_PRICING_JSON) : {};
    return { ...DEFAULT_PRICING, ...override };
  } catch {
    return { ...DEFAULT_PRICING };
  }
})();

// Cumulative usage since process start (surfaced e.g. on /api/health).
const usageTotals = { calls: 0, promptTokens: 0, completionTokens: 0, costUsd: 0, hasEstimates: false };

export function getAIUsageTotals() {
  return { ...usageTotals };
}

function estimateCost(model, usage) {
  const p = PRICING[model];
  if (!p || !usage) return null;
  const inTok = usage.prompt_tokens || 0;
  const outTok = usage.completion_tokens || 0;
  return (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
}

/**
 * Record and log token usage / cost for one AI call. Prefers the provider's
 * actual cost (OpenRouter returns usage.cost when `usage.include` is set) and
 * falls back to a local price estimate. Invokes optional onUsage(record) so a
 * caller (e.g. a route) can accumulate per-interview cost. Never throws.
 */
function recordUsage(label, model, usage, onUsage) {
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  const actualCost = typeof usage?.cost === 'number' ? usage.cost : null;
  const cost = actualCost != null ? actualCost : estimateCost(model, usage);
  const estimated = actualCost == null;

  usageTotals.calls += 1;
  usageTotals.promptTokens += promptTokens;
  usageTotals.completionTokens += completionTokens;
  if (typeof cost === 'number') usageTotals.costUsd += cost;
  if (estimated && typeof cost === 'number') usageTotals.hasEstimates = true;

  const costStr = typeof cost === 'number' ? `$${cost.toFixed(6)}${estimated ? '~' : ''}` : 'n/a';
  console.log(
    `💰 [AI] ${label} model=${model} in=${promptTokens} out=${completionTokens} cost=${costStr} ` +
      `| session: ${usageTotals.calls} calls, $${usageTotals.costUsd.toFixed(4)}${usageTotals.hasEstimates ? '~' : ''}`
  );

  const record = {
    label,
    model,
    promptTokens,
    completionTokens,
    cost: typeof cost === 'number' ? cost : 0,
    estimated,
  };
  if (typeof onUsage === 'function') {
    try {
      onUsage(record);
    } catch {
      /* accounting must never break the call */
    }
  }
  return record;
}

/**
 * Extract a JSON value from a model response that may include prose,
 * markdown fences, or trailing notes. Returns the parsed value.
 * Throws if no parseable JSON object/array is found.
 */
export function extractJson(raw) {
  if (raw == null) throw new Error('Empty AI response');
  let text = String(raw).trim();

  // Strip markdown code fences.
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Fast path: already valid JSON.
  try {
    return JSON.parse(text);
  } catch {
    /* fall through to substring extraction */
  }

  // Extract the first balanced {...} or [...] block.
  const startCandidates = [];
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');
  if (firstObj !== -1) startCandidates.push(firstObj);
  if (firstArr !== -1) startCandidates.push(firstArr);
  if (startCandidates.length === 0) throw new Error('No JSON found in AI response');

  const start = Math.min(...startCandidates);
  const open = text[start];
  const close = open === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        return JSON.parse(candidate);
      }
    }
  }
  throw new Error('Unterminated JSON in AI response');
}

/**
 * Call the chat API expecting a JSON response. Requests JSON mode where
 * supported and robustly extracts JSON from the reply. Detects truncation.
 * Throws on failure (caller decides fallback behaviour).
 */
export async function chatJSON({
  system,
  user,
  model = AI_MODEL,
  temperature = 0.2,
  maxTokens = 1024,
  label = 'chat-json',
  onUsage,
}) {
  const client = getAIClient();
  if (!client) throw new Error('AI not configured');

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    usage: { include: true }, // ask OpenRouter to return actual cost
  });

  // Tokens are spent even when the response is truncated/empty — record first.
  recordUsage(label, model, completion.usage, onUsage);

  const choice = completion.choices?.[0];
  const content = choice?.message?.content;

  if (choice?.finish_reason === 'length') {
    throw new Error('AI response truncated (increase max_tokens)');
  }
  if (!content) throw new Error('Empty AI response');

  return extractJson(content);
}

/**
 * Call the chat API expecting free-form text. Same client/timeout/retry.
 */
export async function chatText({
  system,
  user,
  model = AI_MODEL,
  temperature = 0.4,
  maxTokens = 1024,
  label = 'chat-text',
  onUsage,
}) {
  const client = getAIClient();
  if (!client) throw new Error('AI not configured');

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    max_tokens: maxTokens,
    usage: { include: true }, // ask OpenRouter to return actual cost
  });

  recordUsage(label, model, completion.usage, onUsage);

  return completion.choices?.[0]?.message?.content?.trim() || '';
}

// Clamp a numeric score into [0, 1]; returns null if not a finite number.
export function clamp01(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}
