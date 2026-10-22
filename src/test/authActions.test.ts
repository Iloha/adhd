import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPin } from '../lib/pin'
import { resetPinLimiter } from '../lib/pinLimiter'

const ID = '3f0f3c4e-1b2a-4c5d-8e9f-0a1b2c3d4e5f'

// Next's redirect() throws; mimic that so code after it does not run.
class Redirect extends Error {
  constructor(public url: string) {
    super(`redirect:${url}`)
  }
}
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Redirect(url)
  },
}))

const store = { childId: null as string | null, cleared: 0, entered: null as string | null }
vi.mock('../lib/childModeServer', () => ({
  getChildModeChildId: async () => store.childId,
  clearChildModeCookie: async () => {
    store.cleared++
  },
  enterChildModeCookie: async (id: string) => {
    store.entered = id
  },
}))

const seed = vi.fn()
vi.mock('../lib/demo', () => ({ seedDemoData: (...args: unknown[]) => seed(...args) }))

// A tiny fake Supabase client with just what the actions use.
const db = { claims: null as null | Record<string, unknown>, pinHash: null as string | null, child: null as { id: string } | null }
const signInAnonymously = vi.fn()
const signOutFn = vi.fn()
const insertPin = vi.fn()
vi.mock('../lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({ data: db.claims ? { claims: db.claims } : null }),
      signInAnonymously,
      signOut: signOutFn,
    },
    from: (table: string) => {
      if (table === 'parent_settings') {
        return {
          select: (_cols: string, opts?: { head?: boolean }) =>
            opts?.head
              ? Promise.resolve({ count: db.pinHash ? 1 : 0 })
              : { maybeSingle: async () => ({ data: db.pinHash ? { pin_hash: db.pinHash } : null }) },
          insert: insertPin,
        }
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.child }) }) }) }
    },
  }),
}))

import { exitChildMode } from '../app/child/actions'
import { setPin, startChildMode } from '../app/parent/actions'
import { signOut } from '../app/auth/actions'
import { startDemo } from '../app/login/actions'

async function redirectedTo(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    if (error instanceof Redirect) return error.url
    throw error
  }
  return null
}

beforeEach(() => {
  store.childId = null
  store.cleared = 0
  store.entered = null
  db.claims = { sub: 'user-1' }
  db.pinHash = null
  db.child = null
  resetPinLimiter()
  seed.mockReset()
  signInAnonymously.mockReset()
  signOutFn.mockReset()
  insertPin.mockReset()
  insertPin.mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('exitChildMode', () => {
  it('sends a signed-out user to /login', async () => {
    db.claims = null
    expect(await redirectedTo(exitChildMode('1234'))).toBe('/login')
  })

  it('clears the cookie and goes to /parent on the right PIN', async () => {
    db.pinHash = await hashPin('1234')
    expect(await redirectedTo(exitChildMode('1234'))).toBe('/parent')
    expect(store.cleared).toBe(1)
  })

  it('keeps child mode on a wrong PIN and says how many tries are left', async () => {
    db.pinHash = await hashPin('1234')
    const result = await exitChildMode('0000')
    expect(result).toEqual({ error: 'Wrong PIN. 4 tries left.' })
    expect(store.cleared).toBe(0)
  })

  it('locks after 5 wrong tries, even for the right PIN', async () => {
    db.pinHash = await hashPin('1234')
    for (let i = 0; i < 5; i++) await exitChildMode('0000')
    const result = (await exitChildMode('1234')) as { error: string }
    expect(result.error).toMatch(/Too many wrong tries/)
    expect(store.cleared).toBe(0)
  })

  it('counts a missing PIN row as a wrong PIN', async () => {
    expect((await exitChildMode('1234') as { error: string }).error).toMatch(/Wrong PIN/)
  })
})

describe('setPin', () => {
  it('is refused in child mode', async () => {
    store.childId = ID
    expect((await setPin('1234')).error).toMatch(/parent mode/)
    expect(insertPin).not.toHaveBeenCalled()
  })

  it('rejects an invalid PIN', async () => {
    expect((await setPin('12')).error).toMatch(/4 digits/)
    expect(insertPin).not.toHaveBeenCalled()
  })

  it('stores only a hash, with the signed-in user id', async () => {
    expect(await setPin('1234')).toEqual({ error: null })
    const row = insertPin.mock.calls[0][0]
    expect(row.user_id).toBe('user-1')
    expect(row.pin_hash).not.toContain('1234')
  })

  it('does not overwrite an existing PIN', async () => {
    db.pinHash = await hashPin('1111')
    expect((await setPin('2222')).error).toMatch(/already set/)
    expect(insertPin).not.toHaveBeenCalled()
  })
})

describe('startChildMode', () => {
  it('is refused in child mode', async () => {
    store.childId = ID
    expect((await startChildMode(ID)).error).toMatch(/parent mode/)
  })

  it('rejects a malformed child id', async () => {
    expect((await startChildMode('1')).error).toMatch(/choose a child/)
  })

  it('needs a PIN first', async () => {
    expect((await startChildMode(ID)).error).toMatch(/Set a PIN/)
    expect(store.entered).toBeNull()
  })

  it('refuses a child that is not visible to this parent (RLS)', async () => {
    db.pinHash = await hashPin('1234')
    db.child = null
    expect((await startChildMode(ID)).error).toMatch(/not found/)
    expect(store.entered).toBeNull()
  })

  it('sets the cookie and goes to /child', async () => {
    db.pinHash = await hashPin('1234')
    db.child = { id: ID }
    expect(await redirectedTo(startChildMode(ID))).toBe('/child')
    expect(store.entered).toBe(ID)
  })
})

describe('signOut', () => {
  it('does nothing in child mode', async () => {
    store.childId = ID
    expect(await redirectedTo(signOut())).toBe('/child')
    expect(signOutFn).not.toHaveBeenCalled()
  })

  it('signs out and goes to /login', async () => {
    expect(await redirectedTo(signOut())).toBe('/login')
    expect(signOutFn).toHaveBeenCalled()
  })
})

describe('startDemo', () => {
  it('signs in anonymously, seeds, and goes to /parent', async () => {
    db.claims = null
    signInAnonymously.mockResolvedValue({ data: { user: { is_anonymous: true } }, error: null })
    expect(await redirectedTo(startDemo())).toBe('/parent')
    expect(seed).toHaveBeenCalledTimes(1)
  })

  it('never seeds or touches a real account', async () => {
    db.claims = { sub: 'real', is_anonymous: false }
    expect(await redirectedTo(startDemo())).toBe('/parent')
    expect(signInAnonymously).not.toHaveBeenCalled()
    expect(seed).not.toHaveBeenCalled()
  })

  it('reports an error when anonymous sign-in fails', async () => {
    db.claims = null
    signInAnonymously.mockResolvedValue({ data: { user: null }, error: new Error('off') })
    expect((await startDemo()).error).toMatch(/not available/)
  })

  it('still opens the demo if seeding fails', async () => {
    db.claims = null
    signInAnonymously.mockResolvedValue({ data: { user: { is_anonymous: true } }, error: null })
    seed.mockRejectedValue(new Error('boom'))
    expect(await redirectedTo(startDemo())).toBe('/parent')
  })
})
