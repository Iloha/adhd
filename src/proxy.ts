import type { NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

// Next.js 16 renamed "middleware" to "proxy".
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Skip static files and image optimisation. API routes are included so the
  // session is refreshed for them; they handle their own 401s.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
