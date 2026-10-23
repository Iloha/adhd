import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/supabase/routes'
import { clearChildModeCookie } from '@/lib/childModeServer'

// Magic links land here with ?code=... (PKCE). Exchange it for a session cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await clearChildModeCookie()
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('auth callback: could not exchange code', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
