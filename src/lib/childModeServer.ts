import { cookies } from 'next/headers'
import { CHILD_MODE_COOKIE, childModeCookieOptions, parseChildModeCookie } from './childMode'

/** The child id of the active child mode, or null when the browser is in parent mode. */
export async function getChildModeChildId(): Promise<string | null> {
  const store = await cookies()
  return parseChildModeCookie(store.get(CHILD_MODE_COOKIE)?.value)
}

export async function enterChildModeCookie(childId: string) {
  const store = await cookies()
  store.set(CHILD_MODE_COOKIE, childId, childModeCookieOptions(process.env.NODE_ENV === 'production'))
}

export async function clearChildModeCookie() {
  const store = await cookies()
  store.delete(CHILD_MODE_COOKIE)
}
