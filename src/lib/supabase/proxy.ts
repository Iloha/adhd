import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { CHILD_MODE_COOKIE, parseChildModeCookie } from '../childMode'
import { getAuthRedirect } from './routes'

/**
 * Refreshes the Supabase session on every request and applies the auth redirect
 * rules. Called from src/proxy.ts (the Next.js 16 name for middleware).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // getClaims() verifies the JWT signature, so a forged cookie is not trusted.
  // Do not run other code between createServerClient and this call.
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims?.sub)

  const target = getAuthRedirect(request.nextUrl.pathname, {
    isSignedIn,
    isAnonymous: data?.claims?.is_anonymous === true,
    inChildMode: parseChildModeCookie(request.cookies.get(CHILD_MODE_COOKIE)?.value) !== null,
  })
  if (!target) return response

  const redirect = NextResponse.redirect(new URL(target, request.url))
  // Keep any refreshed session cookies on the redirect response too.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}
