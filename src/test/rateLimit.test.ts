import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit, resetRateLimit } from '../lib/rateLimit'

beforeEach(() => resetRateLimit())

describe('checkRateLimit', () => {
  it('allows requests up to the max, then blocks', () => {
    for (let i = 0; i < 3; i++) expect(checkRateLimit('a', { max: 3, now: 1000 })).toBe(true)
    expect(checkRateLimit('a', { max: 3, now: 1000 })).toBe(false)
  })

  it('tracks each key separately', () => {
    expect(checkRateLimit('a', { max: 1, now: 1000 })).toBe(true)
    expect(checkRateLimit('a', { max: 1, now: 1000 })).toBe(false)
    expect(checkRateLimit('b', { max: 1, now: 1000 })).toBe(true)
  })

  it('allows requests again once the window has passed', () => {
    const opts = { max: 1, windowMs: 60_000 }
    expect(checkRateLimit('a', { ...opts, now: 0 })).toBe(true)
    expect(checkRateLimit('a', { ...opts, now: 59_999 })).toBe(false)
    expect(checkRateLimit('a', { ...opts, now: 60_000 })).toBe(true)
  })

  it('does not count blocked requests against the window', () => {
    const opts = { max: 1, windowMs: 60_000 }
    checkRateLimit('a', { ...opts, now: 0 })
    checkRateLimit('a', { ...opts, now: 30_000 })
    expect(checkRateLimit('a', { ...opts, now: 60_000 })).toBe(true)
  })
})
