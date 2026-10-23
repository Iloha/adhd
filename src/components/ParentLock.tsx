"use client"

import { useState, useTransition } from "react"
import PinPad from "./PinPad"
import { exitChildMode } from "../app/child/actions"

/** Small lock button for the child screen. Opens a PIN pad; the right PIN returns to parent mode. */
function ParentLock() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onPin = (pin: string) => {
    startTransition(async () => {
      // On success the server action redirects to /parent, so this only returns an error.
      const result = await exitChildMode(pin)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setOpen(true) }}
        className="fixed top-4 right-4 z-10 flex items-center gap-2 min-h-12 px-4 rounded-full bg-white/90 border border-gray-300 text-base font-medium text-gray-800 shadow hover:bg-white"
      >
        <span aria-hidden>🔒</span> Parent
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Parent PIN" className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4 shadow-xl">
            <PinPad label="Enter the parent PIN" onComplete={onPin} disabled={pending} error={error} />
            <button type="button" onClick={() => setOpen(false)} className="w-full min-h-12 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}

export default ParentLock
