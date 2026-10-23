// Limits wrong PIN guesses: 5 wrong tries, then a 1 minute lock.
//
// TODO: this is in-memory, so on Vercel it is per serverless instance and resets on
// cold starts. For a hard guarantee store the counters in the database (or Upstash).

export const MAX_PIN_ATTEMPTS = 5
export const PIN_LOCK_MS = 60_000

interface Entry {
  failures: number
  lockedUntil: number
}

const entries = new Map<string, Entry>()

/** Milliseconds left on the lock for `key`, or 0 if it may try now. */
export function pinLockRemainingMs(key: string, now = Date.now()): number {
  const entry = entries.get(key)
  if (!entry || entry.lockedUntil <= now) return 0
  return entry.lockedUntil - now
}

/** Records a wrong PIN. Returns how many tries are left before the lock (0 = now locked). */
export function recordPinFailure(key: string, now = Date.now()): number {
  const entry = entries.get(key) ?? { failures: 0, lockedUntil: 0 }
  // A lock that has expired starts a fresh count.
  if (entry.lockedUntil !== 0 && entry.lockedUntil <= now) {
    entry.failures = 0
    entry.lockedUntil = 0
  }
  entry.failures += 1
  if (entry.failures >= MAX_PIN_ATTEMPTS) {
    entry.failures = 0
    entry.lockedUntil = now + PIN_LOCK_MS
    entries.set(key, entry)
    return 0
  }
  entries.set(key, entry)
  return MAX_PIN_ATTEMPTS - entry.failures
}

export function clearPinFailures(key: string) {
  entries.delete(key)
}

export function resetPinLimiter() {
  entries.clear()
}

/** The message shown after a wrong PIN, given the tries left from recordPinFailure. */
export function pinFailureMessage(left: number): string {
  if (left === 0) return 'Too many wrong tries. Wait 1 minute and try again.'
  return `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.`
}
