// Child mode is a cookie: it is set and cleared only by server actions, and the proxy
// reads it to keep a child out of /parent. The cookie value is the selected child's id.
//
// This is a soft lock for young kids, not a security boundary: someone who controls the
// browser (developer tools) can still delete the cookie or call the database directly
// with the parent's session.

export const CHILD_MODE_COOKIE = 'child_mode'
export const CHILD_MODE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Returns the child id from the cookie value, or null if it is missing or malformed. */
export function parseChildModeCookie(value: string | undefined | null): string | null {
  return value && UUID.test(value) ? value : null
}

export function isChildId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

export function childModeCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction,
    path: '/',
    maxAge: CHILD_MODE_MAX_AGE_SECONDS,
  }
}
