"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { seedDemoData } from '@/lib/demo'
import { clearChildModeCookie } from '@/lib/childModeServer'

export interface DemoState {
  error: string | null
}

/** "Try demo": anonymous sign-in, seed sample data for new demo users, go to /parent. */
export async function startDemo(): Promise<DemoState> {
  const supabase = await createClient()

  const { data: existing } = await supabase.auth.getClaims()
  let isAnonymous = existing?.claims?.is_anonymous === true
  const signedIn = Boolean(existing?.claims?.sub)

  // Reuse a session that already exists (e.g. someone who clicked "Try demo" twice).
  if (!signedIn) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) {
      console.error('demo: anonymous sign-in failed', error)
      return { error: 'The demo is not available right now. Please try again in a moment.' }
    }
    isAnonymous = data.user.is_anonymous === true
  }

  // Never seed (or touch) data of a real account.
  if (isAnonymous) {
    try {
      await seedDemoData(supabase)
    } catch (error) {
      // Do not block the demo if seeding fails; the user just starts with an empty list.
      console.error('demo: seeding failed', error)
    }
  }

  await clearChildModeCookie()
  redirect('/parent')
}
