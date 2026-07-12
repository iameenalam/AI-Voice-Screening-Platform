// Minimal in-memory rate limiter (no external dependency).
// Suitable for a single-instance deployment; for multi-instance use a shared
// store (Redis). Guards unauthenticated, cost-bearing endpoints from abuse.

export function rateLimit({ windowMs = 60_000, max = 20, key } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Periodically drop expired buckets so the map does not grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) {
      if (v.resetAt <= now) hits.delete(k);
    }
  }, windowMs);
  if (typeof sweep.unref === 'function') sweep.unref();

  return (req, res, next) => {
    // Key on req.ip, which Express derives from X-Forwarded-For against the
    // configured `trust proxy` hop count — NOT the raw header, which a client
    // can spoof to mint a fresh bucket per request. (See app.set('trust proxy')
    // in index.js.) Falls back to the socket address in non-proxied setups.
    const id = key ? key(req) : (req.ip || req.socket?.remoteAddress || 'unknown');
    const now = Date.now();
    let bucket = hits.get(id);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      hits.set(id, bucket);
    }

    bucket.count++;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }

    next();
  };
}
