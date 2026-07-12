import OpenAI, { toFile } from 'openai';

// Audio transcription for interview answers. Prefers a direct OpenAI key
// (OPENAI_API_KEY) — no duration cap, modern gpt-4o-mini-transcribe model.
// Falls back to routing through OpenRouter (OPENROUTER_API_KEY) using
// whisper-1 / whisper-large-v3 when no direct OpenAI key is set. OpenRouter's
// audio endpoint times out upstream providers after ~60s per request, so an
// answer longer than that isn't attempted via that path and the browser's
// speech-recognition text is kept instead (see MAX_OPENROUTER_DURATION_MS).
// If OPENAI_API_KEY is added later, this automatically upgrades to the direct
// path with no further config.

const REQUEST_TIMEOUT_MS = Number(process.env.TRANSCRIBE_TIMEOUT_MS || 60000);
const MAX_RETRIES = Number(process.env.TRANSCRIBE_MAX_RETRIES || 2);
const MAX_AUDIO_BYTES = 16 * 1024 * 1024; // matches the uploader's 16MB cap

// OpenRouter's upstream provider times out at ~60s of processing; stay under
// that with a safety margin rather than wait out a doomed request.
const MAX_OPENROUTER_DURATION_MS = 55_000;

function resolveProvider() {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  return null;
}

export function isTranscribeConfigured() {
  return resolveProvider() !== null;
}

// The model actually used for the active provider. An explicit
// TRANSCRIBE_MODEL always wins; otherwise a sensible per-provider default.
export function getTranscribeModel() {
  if (process.env.TRANSCRIBE_MODEL) return process.env.TRANSCRIBE_MODEL;
  return resolveProvider() === 'openrouter' ? 'openai/whisper-large-v3' : 'gpt-4o-mini-transcribe';
}

// Lazy singleton client (same pattern as utils/ai.js) — rebuilt if the active
// provider or key changes (e.g. a key is added/rotated without a restart).
let cachedClient = null;
let cachedKey = null;
let cachedProvider = null;

function getTranscribeClient() {
  const provider = resolveProvider();
  if (!provider) return null;

  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.OPENROUTER_API_KEY;
  if (cachedClient && cachedKey === apiKey && cachedProvider === provider) return cachedClient;

  cachedKey = apiKey;
  cachedProvider = provider;
  cachedClient = new OpenAI({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
    ...(provider === 'openrouter'
      ? {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://vocalent.com',
            'X-Title': 'Vocalent',
          },
        }
      : {}),
  });
  return cachedClient;
}

// SSRF guard (same policy as CV parsing in routes/candidates.js): the server
// fetches audioUrl, so restrict it to trusted upload hosts over https.
const AUDIO_ALLOWED_HOSTS = (process.env.AUDIO_URL_ALLOWED_HOSTS || 'utfs.io,ufs.sh,uploadthing.com')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function assertSafeAudioUrl(audioUrl) {
  let u;
  try {
    u = new URL(audioUrl);
  } catch {
    throw new Error('Invalid audio URL');
  }
  if (u.protocol !== 'https:') throw new Error('Audio URL must use https');
  const host = u.hostname.toLowerCase();
  const allowed = AUDIO_ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  if (!allowed) throw new Error('Audio URL host is not allowed');
  return u;
}

// Approximate USD pricing (neither OpenAI nor OpenRouter reliably return cost
// for transcriptions). Prefers token-based pricing when the API reports usage
// tokens, otherwise estimates from audio duration. Override via
// TRANSCRIBE_PRICING_JSON, a JSON object of
// { "<model>": { "perMin": usd, "inTok": usd/1M, "outTok": usd/1M } }.
const DEFAULT_PRICING = {
  // Direct OpenAI model ids.
  'gpt-4o-mini-transcribe': { perMin: 0.003, inTok: 1.25, outTok: 5.0 },
  'gpt-4o-transcribe': { perMin: 0.006, inTok: 2.5, outTok: 10.0 },
  'whisper-1': { perMin: 0.006 },
  // OpenRouter model ids (provider-prefixed).
  'openai/whisper-1': { perMin: 0.006 },
  'openai/whisper-large-v3': { perMin: 0.006 },
};

const PRICING = (() => {
  try {
    const override = process.env.TRANSCRIBE_PRICING_JSON
      ? JSON.parse(process.env.TRANSCRIBE_PRICING_JSON)
      : {};
    return { ...DEFAULT_PRICING, ...override };
  } catch {
    return { ...DEFAULT_PRICING };
  }
})();

function estimateCost(model, usage, durationMs) {
  const p = PRICING[model];
  if (!p) return null;
  if (usage && p.inTok != null && (usage.input_tokens || usage.output_tokens)) {
    return (
      ((usage.input_tokens || 0) / 1e6) * p.inTok +
      ((usage.output_tokens || 0) / 1e6) * (p.outTok || 0)
    );
  }
  const seconds = usage?.seconds ?? (durationMs > 0 ? durationMs / 1000 : null);
  if (seconds == null || p.perMin == null) return null;
  return (seconds / 60) * p.perMin;
}

/**
 * Download an answer recording from a trusted upload host and transcribe it.
 * Returns the transcript text ('' when the audio contains no speech).
 * Throws on download/API failure — the caller decides fallback behaviour
 * (interviews keep the browser speech-recognition text when this fails).
 */
export async function transcribeAudioUrl({ url, durationMs = 0, label = 'transcribe', onUsage }) {
  const provider = resolveProvider();
  const client = getTranscribeClient();
  if (!client) throw new Error('Transcription not configured (OPENAI_API_KEY or OPENROUTER_API_KEY missing)');

  if (provider === 'openrouter' && durationMs > MAX_OPENROUTER_DURATION_MS) {
    throw new Error(
      `Recording (${Math.round(durationMs / 1000)}s) exceeds OpenRouter's ~60s transcription limit; keeping browser transcript`
    );
  }

  const model = getTranscribeModel();
  const safeUrl = assertSafeAudioUrl(url);

  const resp = await fetch(safeUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!resp.ok) throw new Error(`Audio download failed (${resp.status})`);
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.length === 0) throw new Error('Audio file is empty');
  if (buf.length > MAX_AUDIO_BYTES) throw new Error('Audio file too large');

  const contentType = resp.headers.get('content-type') || 'audio/webm';
  const ext = contentType.includes('mp4')
    ? 'mp4'
    : contentType.includes('mpeg')
      ? 'mp3'
      : contentType.includes('wav')
        ? 'wav'
        : contentType.includes('ogg')
          ? 'ogg'
          : 'webm';

  const result = await client.audio.transcriptions.create({
    file: await toFile(buf, `answer.${ext}`, { type: contentType }),
    model,
    // 'json' is supported by gpt-4o-(mini-)transcribe and whisper-1/large-v3.
    response_format: 'json',
  });

  const text = (result?.text || '').trim();
  const usage = result?.usage;
  const cost = estimateCost(model, usage, durationMs);
  const costStr = typeof cost === 'number' ? `$${cost.toFixed(6)}~` : 'n/a';
  console.log(
    `💰 [STT] ${label} provider=${provider} model=${model} audio=${(buf.length / 1024).toFixed(0)}KB ` +
      `dur=${durationMs ? Math.round(durationMs / 1000) + 's' : '?'} cost=${costStr}`
  );

  if (typeof onUsage === 'function') {
    try {
      onUsage({
        label,
        model,
        cost: typeof cost === 'number' ? cost : 0,
        estimated: true,
        seconds: usage?.seconds ?? (durationMs ? durationMs / 1000 : 0),
      });
    } catch {
      /* accounting must never break the call */
    }
  }

  return text;
}
