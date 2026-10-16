import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server client for Server Components, Route Handlers and Server Actions.
// Only ever uses the publishable key: row access is enforced by RLS, never by
// a service-role key, which must not be used anywhere in this app's client paths.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // Safe to ignore: the proxy refreshes the session on every request.
          }
        },
      },
    },
  )
}
