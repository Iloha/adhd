"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import PinPad from "./PinPad"
import { changePin, getPinStatus, setPin } from "../app/parent/actions"

type Step = 'current' | 'new' | 'confirm' | 'done'

/** Modal that changes the parent PIN (or sets it, if there is none yet). */
function ChangePinDialog({ onClose }: { onClose: () => void }) {
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [step, setStep] = useState<Step>('current')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getPinStatus()
      .then((value) => {
        if (cancelled) return
        setHasPin(value)
        setStep(value ? 'current' : 'new')
      })
      .catch(() => { if (!cancelled) setError('Could not check the PIN. Please try again.') })
    return () => { cancelled = true }
  }, [])

  // Move focus into the dialog, close on Escape, and keep Tab inside it.
  useEffect(() => {
    dialogRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'Tab') {
        const items = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (!items || items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const restart = (message: string) => {
    setCurrentPin('')
    setNewPin('')
    setError(message)
    setStep(hasPin ? 'current' : 'new')
  }

  const onPin = (pin: string) => {
    if (step === 'current') {
      setCurrentPin(pin)
      setError(null)
      setStep('new')
    } else if (step === 'new') {
      setNewPin(pin)
      setError(null)
      setStep('confirm')
    } else if (step === 'confirm') {
      if (pin !== newPin) return restart("The new PINs didn't match. Let's try again.")
      startTransition(async () => {
        const result = hasPin ? await changePin(currentPin, newPin) : await setPin(newPin)
        if (result.error) restart(result.error)
        else setStep('done')
      })
    }
  }

  const label = {
    current: 'Enter your current PIN',
    new: 'Choose a new 4-digit PIN',
    confirm: 'Enter the new PIN again to confirm',
    done: '',
  }[step]

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-6">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pin-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4 shadow-xl focus:outline-none"
      >
        <h2 id="change-pin-title" className="text-xl font-bold text-gray-900 text-center">
          {hasPin === false ? 'Set PIN' : 'Change PIN'}
        </h2>
        {hasPin === null && !error && <p role="status" className="text-center text-gray-600">Checking...</p>}
        {hasPin === null && error && <p role="alert" className="text-center text-red-700 font-medium">{error}</p>}
        {hasPin !== null && step !== 'done' && (
          <PinPad key={step} label={label} onComplete={onPin} disabled={pending} error={error} />
        )}
        {step === 'done' && <p role="status" className="text-center text-lg font-medium text-gray-900">Your PIN was saved.</p>}
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-12 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        >
          {step === 'done' ? 'Done' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}

export default ChangePinDialog
