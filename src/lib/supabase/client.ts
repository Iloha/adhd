import { createBrowserClient } from '@supabase/ssr'

// Browser client. @supabase/ssr keeps it as a singleton in the browser and stores
// the session in cookies, so the server client and the proxy see the same session.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_KEY as string,
  )
}
