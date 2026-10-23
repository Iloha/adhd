"use client"

import { useEffect, useState, useTransition } from "react"
import PinPad from "./PinPad"
import ErrorBanner from "./ErrorBanner"
import { getPinStatus, setPin, startChildMode } from "../app/parent/actions"
import type { Child } from "../types"

interface StartChildModeProps {
  children: Child[]
  onManageChildren: () => void
}

/** Parent flow: set a PIN the first time, then choose the child who will use child mode. */
function StartChildMode({ children: childProfiles, onManageChildren }: StartChildModeProps) {
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [firstPin, setFirstPin] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getPinStatus()
      .then((value) => { if (!cancelled) setHasPin(value) })
      .catch(() => { if (!cancelled) setError('Could not check the PIN. Please reload the page.') })
    return () => { cancelled = true }
  }, [])

  const onPinEntered = (pin: string) => {
    if (firstPin === null) {
      setFirstPin(pin)
      setError(null)
      return
    }
    if (pin !== firstPin) {
      setFirstPin(null)
      setError("The PINs didn't match. Let's try again.")
      return
    }
    startTransition(async () => {
      const result = await setPin(pin)
      if (result.error) {
        setFirstPin(null)
        setError(result.error)
      } else {
        setError(null)
        setHasPin(true)
      }
    })
  }

  const choose = (childId: string) => {
    setError(null)
    startTransition(async () => {
      // On success the server action redirects to /child, so this only returns an error.
      const result = await startChildMode(childId)
      if (result?.error) setError(result.error)
    })
  }

  if (hasPin === null) {
    return <p role="status" className="py-8 text-gray-600">Checking...</p>
  }

  if (!hasPin) {
    return (
      <div className="max-w-md mx-auto py-8 space-y-4">
        <p className="text-gray-700 text-center">
          Child mode is locked with a 4-digit parent PIN. You will need it to get back to this screen.
        </p>
        <PinPad
          label={firstPin === null ? 'Choose a 4-digit PIN' : 'Enter the PIN again to confirm'}
          onComplete={onPinEntered}
          disabled={pending}
          error={error}
        />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-8 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 text-center">Who is using it?</h3>
      {childProfiles.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="text-gray-700">Add a child profile first.</p>
          <button type="button" onClick={onManageChildren} className="min-h-12 px-5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">Add a child</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {childProfiles.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => choose(child.id)}
                className="w-full min-h-16 flex items-center justify-center gap-3 rounded-2xl bg-white border border-gray-300 text-xl font-bold text-gray-900 hover:bg-gray-100 disabled:opacity-50"
              >
                {child.avatar && <span aria-hidden className="text-3xl">{child.avatar}</span>}
                {child.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ErrorBanner message={error} />
    </div>
  )
}

export default StartChildMode
