import { beforeEach, describe, expect, it } from 'vitest'
import { hashPin, isValidPin, verifyPin } from '../lib/pin'
import {
  MAX_PIN_ATTEMPTS,
  PIN_LOCK_MS,
  clearPinFailures,
  pinLockRemainingMs,
  recordPinFailure,
  resetPinLimiter,
} from '../lib/pinLimiter'

describe('PIN hashing', () => {
  it.each(['1234', '0000'])('accepts %s', (pin) => expect(isValidPin(pin)).toBe(true))
  it.each(['123', '12345', 'abcd', '12 4', '', 1234, null])('rejects %j', (pin) => expect(isValidPin(pin)).toBe(false))

  it('stores a bcrypt hash, never the PIN, and verifies it', async () => {
    const hash = await hashPin('4821')
    expect(hash).not.toContain('4821')
    expect(hash).toMatch(/^\$2[aby]\$/)
    expect(await verifyPin('4821', hash)).toBe(true)
    expect(await verifyPin('4822', hash)).toBe(false)
  })

  it('refuses to hash an invalid PIN and never verifies bad input', async () => {
    await expect(hashPin('12')).rejects.toThrow()
    const hash = await hashPin('4821')
    expect(await verifyPin('abc', hash)).toBe(false)
    expect(await verifyPin('4821', '')).toBe(false)
    expect(await verifyPin('4821', 'not-a-hash')).toBe(false)
  })
})

describe('PIN limiter', () => {
  beforeEach(() => resetPinLimiter())

  it('counts down the tries left, then locks', () => {
    for (let i = 1; i < MAX_PIN_ATTEMPTS; i++) {
      expect(recordPinFailure('u', 0)).toBe(MAX_PIN_ATTEMPTS - i)
    }
    expect(recordPinFailure('u', 0)).toBe(0)
    expect(pinLockRemainingMs('u', 1000)).toBe(PIN_LOCK_MS - 1000)
  })

  it('unlocks after the lock time and starts a fresh count', () => {
    for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) recordPinFailure('u', 0)
    expect(pinLockRemainingMs('u', PIN_LOCK_MS)).toBe(0)
    expect(recordPinFailure('u', PIN_LOCK_MS)).toBe(MAX_PIN_ATTEMPTS - 1)
  })

  it('tracks users separately and can be cleared', () => {
    for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) recordPinFailure('a', 0)
    expect(pinLockRemainingMs('b', 1)).toBe(0)
    clearPinFailures('a')
    expect(pinLockRemainingMs('a', 1)).toBe(0)
  })
})
