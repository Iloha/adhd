// Pure route rules, kept free of Next/Supabase imports so they are easy to test.

const PUBLIC_PATHS = ['/login']
const PUBLIC_PREFIXES = ['/auth/']

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Where should this request be sent? Returns a path to redirect to, or null to continue.
 * - Not signed in -> /login (except public pages). API routes are never redirected:
 *   they answer 401 themselves, because fetch() cannot follow a redirect to an HTML page usefully.
 * - Signed in with a real account and visiting /login -> /parent. Demo (anonymous) users may
 *   still open /login, because that is where "Create an account" leads.
 */
export function getAuthRedirect(pathname: string, isSignedIn: boolean, isAnonymous = false): string | null {
  if (pathname.startsWith('/api/')) return null
  if (!isSignedIn && !isPublicPath(pathname)) return '/login'
  if (isSignedIn && !isAnonymous && pathname === '/login') return '/parent'
  return null
}

/** Only allow same-site relative redirect targets (blocks open redirects like //evil.com). */
export function safeNextPath(next: string | null | undefined, fallback = '/parent') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
