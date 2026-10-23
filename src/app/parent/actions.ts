"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { enterChildModeCookie, getChildModeChildId } from '@/lib/childModeServer'
import { isChildId } from '@/lib/childMode'
import { hashPin, isValidPin, verifyPin } from '@/lib/pin'
import { clearPinFailures, pinFailureMessage, pinLockRemainingMs, recordPinFailure } from '@/lib/pinLimiter'

export interface ActionState {
  error: string | null
}

const LOCKED: ActionState = { error: 'This can only be done in parent mode.' }

/** Does this parent already have a PIN? (Never returns the hash.) */
export async function getPinStatus(): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase.from('parent_settings').select('user_id', { count: 'exact', head: true })
  return (count ?? 0) > 0
}

/** First-time PIN setup. The PIN is hashed on the server; only the hash is stored. */
export async function setPin(pin: string): Promise<ActionState> {
  if (await getChildModeChildId()) return LOCKED
  if (!isValidPin(pin)) return { error: 'The PIN must be exactly 4 digits.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { error: 'Please sign in again.' }

  if (await getPinStatus()) return { error: 'A PIN is already set.' }

  const { error } = await supabase
    .from('parent_settings')
    .insert({ user_id: userId, pin_hash: await hashPin(pin) })
  if (error) {
    console.error('setPin failed', error)
    return { error: 'Could not save the PIN. Please try again.' }
  }
  return { error: null }
}

/**
 * Changes an existing PIN. The current PIN is required, and wrong guesses count against the
 * same lock as leaving child mode, so this cannot be used to guess the PIN.
 */
export async function changePin(currentPin: string, newPin: string): Promise<ActionState> {
  if (await getChildModeChildId()) return LOCKED
  if (!isValidPin(newPin)) return { error: 'The PIN must be exactly 4 digits.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { error: 'Please sign in again.' }

  const lockedMs = pinLockRemainingMs(userId)
  if (lockedMs > 0) {
    return { error: `Too many wrong tries. Wait ${Math.ceil(lockedMs / 1000)} seconds and try again.` }
  }

  const { data: settings } = await supabase.from('parent_settings').select('pin_hash').maybeSingle()
  if (!settings) return { error: 'No PIN is set yet.' }

  if (!(await verifyPin(currentPin, settings.pin_hash))) {
    return { error: pinFailureMessage(recordPinFailure(userId)) }
  }

  const { error } = await supabase
    .from('parent_settings')
    .update({ pin_hash: await hashPin(newPin), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) {
    console.error('changePin failed', error)
    return { error: 'Could not save the PIN. Please try again.' }
  }
  clearPinFailures(userId)
  return { error: null }
}

/** Starts child mode for one child: sets the httpOnly cookie, then goes to /child. */
export async function startChildMode(childId: string): Promise<ActionState> {
  if (await getChildModeChildId()) return LOCKED
  if (!isChildId(childId)) return { error: 'Please choose a child.' }

  // Child mode can only start once a PIN exists, otherwise there would be no way out.
  if (!(await getPinStatus())) return { error: 'Set a PIN first.' }

  // RLS only returns this parent's own children.
  const supabase = await createClient()
  const { data: child } = await supabase.from('children').select('id').eq('id', childId).maybeSingle()
  if (!child) return { error: 'That child profile was not found.' }

  await enterChildModeCookie(child.id)
  redirect('/child')
}
