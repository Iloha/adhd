"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChildModeChildId } from '@/lib/childModeServer'

export async function signOut() {
  // Signing out is a parent action: ignore it while child mode is active.
  if (await getChildModeChildId()) redirect('/child')

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
