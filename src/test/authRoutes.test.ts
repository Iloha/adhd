import { describe, expect, it } from 'vitest'
import { CHILD_MODE_COOKIE, childModeCookieOptions, isChildId, parseChildModeCookie } from '../lib/childMode'
import { getAuthRedirect, isPublicPath, safeNextPath } from '../lib/supabase/routes'

const ID = '3f0f3c4e-1b2a-4c5d-8e9f-0a1b2c3d4e5f'

describe('getAuthRedirect', () => {
  it('sends signed-out visitors to /login, except on public pages', () => {
    expect(getAuthRedirect('/parent', { isSignedIn: false })).toBe('/login')
    expect(getAuthRedirect('/child', { isSignedIn: false })).toBe('/login')
    expect(getAuthRedirect('/', { isSignedIn: false })).toBe('/login')
    expect(getAuthRedirect('/login', { isSignedIn: false })).toBeNull()
    expect(getAuthRedirect('/auth/callback', { isSignedIn: false })).toBeNull()
  })

  it('never redirects API routes (they answer 401 themselves)', () => {
    expect(getAuthRedirect('/api/breakdown', { isSignedIn: false })).toBeNull()
    expect(getAuthRedirect('/api/breakdown', { isSignedIn: true, inChildMode: true })).toBeNull()
  })

  it('keeps a child in /child: /parent and /login go back to /child', () => {
    const state = { isSignedIn: true, inChildMode: true }
    expect(getAuthRedirect('/parent', state)).toBe('/child')
    expect(getAuthRedirect('/parent/anything', state)).toBe('/child')
    expect(getAuthRedirect('/login', state)).toBe('/child')
    expect(getAuthRedirect('/child', state)).toBeNull()
  })

  it('does not treat lookalike paths as /parent', () => {
    expect(getAuthRedirect('/parentage', { isSignedIn: true, inChildMode: true })).toBeNull()
  })

  it('sends parent mode away from /child and real accounts away from /login', () => {
    expect(getAuthRedirect('/child', { isSignedIn: true })).toBe('/parent')
    expect(getAuthRedirect('/login', { isSignedIn: true })).toBe('/parent')
    expect(getAuthRedirect('/parent', { isSignedIn: true })).toBeNull()
  })

  it('lets demo (anonymous) users open /login to create an account', () => {
    expect(getAuthRedirect('/login', { isSignedIn: true, isAnonymous: true })).toBeNull()
  })
})

describe('isPublicPath', () => {
  it('allows only /login and /auth/*', () => {
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/auth/callback')).toBe(true)
    expect(isPublicPath('/loginx')).toBe(false)
    expect(isPublicPath('/parent')).toBe(false)
  })
})

describe('safeNextPath', () => {
  it('keeps same-site relative paths', () => {
    expect(safeNextPath('/child')).toBe('/child')
  })

  it.each([
    ['null', null],
    ['empty', ''],
    ['absolute URL', 'https://evil.example'],
    ['protocol-relative', '//evil.example'],
    ['backslash trick', '/\\evil.example'],
    ['no leading slash', 'evil.example'],
  ])('falls back to /parent for %s (blocks open redirects)', (_name, value) => {
    expect(safeNextPath(value)).toBe('/parent')
  })
})

describe('child mode cookie', () => {
  it('accepts a uuid and rejects anything else', () => {
    expect(parseChildModeCookie(ID)).toBe(ID)
    expect(parseChildModeCookie('1')).toBeNull()
    expect(parseChildModeCookie("x'; drop table tasks;--")).toBeNull()
    expect(parseChildModeCookie(undefined)).toBeNull()
    expect(parseChildModeCookie('')).toBeNull()
  })

  it('isChildId only accepts uuid strings', () => {
    expect(isChildId(ID)).toBe(true)
    expect(isChildId(42)).toBe(false)
    expect(isChildId('nope')).toBe(false)
  })

  it('is httpOnly, lax, site-wide, and secure in production only', () => {
    expect(CHILD_MODE_COOKIE).toBe('child_mode')
    expect(childModeCookieOptions(true)).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: true })
    expect(childModeCookieOptions(false).secure).toBe(false)
  })
})
