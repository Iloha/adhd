// Pure route rules, kept free of Next/Supabase imports so they are easy to test.

const PUBLIC_PATHS = ['/login']
const PUBLIC_PREFIXES = ['/auth/']

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export interface AuthState {
  isSignedIn: boolean
  /** Demo (anonymous) user. */
  isAnonymous?: boolean
  /** The browser has the child-mode cookie. */
  inChildMode?: boolean
}

/**
 * Where should this request be sent? Returns a path to redirect to, or null to continue.
 * - API routes are never redirected: they answer 401 themselves.
 * - Not signed in -> /login (except public pages).
 * - Child mode: /parent and /login go to /child, so a child cannot leave without the PIN.
 * - Parent mode: /child goes to /parent, because child mode only starts from the parent screen.
 * - Signed in with a real account and visiting /login -> /parent. Demo (anonymous) users may
 *   still open /login, because that is where "Create an account" leads.
 */
export function getAuthRedirect(pathname: string, state: AuthState): string | null {
  const { isSignedIn, isAnonymous = false, inChildMode = false } = state

  if (pathname.startsWith('/api/')) return null
  if (!isSignedIn) return isPublicPath(pathname) ? null : '/login'

  if (inChildMode) {
    if (isUnder(pathname, '/parent') || pathname === '/login') return '/child'
    return null
  }

  if (isUnder(pathname, '/child')) return '/parent'
  if (pathname === '/login' && !isAnonymous) return '/parent'
  return null
}

/** Only allow same-site relative redirect targets (blocks open redirects like //evil.com). */
export function safeNextPath(next: string | null | undefined, fallback = '/parent') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
