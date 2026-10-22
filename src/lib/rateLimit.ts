// TODO: replace with Upstash Ratelimit (@upstash/ratelimit + Redis). This
// in-memory limiter is per serverless instance and resets on cold start, so on
// Vercel it is best-effort only. The provider's own API quota is the real backstop.

export const RATE_LIMIT_MAX = 10
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const hits = new Map<string, number[]>()

/** Returns true if the request is allowed, false if `key` is over the limit. */
export function checkRateLimit(
  key: string,
  { max = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS, now = Date.now() } = {},
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }

  recent.push(now)
  hits.set(key, recent)

  // Keep the map from growing forever on a long-lived instance.
  if (hits.size > 1000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k)
    }
  }
  return true
}

export function resetRateLimit() {
  hits.clear()
}
