"use client"

import { useEffect } from "react"

interface ToastProps {
  /** The text to show, or null for no toast. */
  message: string | null
  onDismiss: () => void
  /** How long it stays before disappearing by itself. */
  durationMs?: number
  /** An extra button inside the toast, e.g. Undo. */
  action?: { label: string; onClick: () => void }
  /** Change it to restart the timer when a new toast shows the same message as the last one. */
  resetKey?: unknown
}

/**
 * A short confirmation message. The live region is always in the page (empty when there is
 * no message), because screen readers only announce changes to a region that already exists.
 */
function Toast({ message, onDismiss, durationMs = 3000, action, resetKey }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [message, onDismiss, durationMs, resetKey])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-40 flex justify-center">
      {message && (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl bg-gray-900 py-1 pl-5 pr-1 text-base font-medium text-white shadow-xl">
          <span className="flex-1 py-2 break-words">{message}</span>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="flex min-h-12 items-center rounded-xl px-4 text-base font-bold text-yellow-300 underline underline-offset-4 hover:bg-white/15 focus-visible:outline-white"
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={onDismiss}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-xl hover:bg-white/15 focus-visible:outline-white"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Toast
