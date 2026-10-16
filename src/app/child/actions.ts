"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { clearChildModeCookie } from '@/lib/childModeServer'
import { verifyPin } from '@/lib/pin'
import { clearPinFailures, pinLockRemainingMs, recordPinFailure } from '@/lib/pinLimiter'
import type { ActionState } from '../parent/actions'

/** Checks the parent PIN. On success clears the child-mode cookie and goes to /parent. */
export async function exitChildMode(pin: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login')

  const lockedMs = pinLockRemainingMs(userId)
  if (lockedMs > 0) {
    return { error: `Too many wrong tries. Wait ${Math.ceil(lockedMs / 1000)} seconds and try again.` }
  }

  const { data: settings } = await supabase.from('parent_settings').select('pin_hash').maybeSingle()

  if (!settings || !(await verifyPin(pin, settings.pin_hash))) {
    const left = recordPinFailure(userId)
    return {
      error: left === 0
        ? 'Too many wrong tries. Wait 1 minute and try again.'
        : `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.`,
    }
  }

  clearPinFailures(userId)
  await clearChildModeCookie()
  redirect('/parent')
}
