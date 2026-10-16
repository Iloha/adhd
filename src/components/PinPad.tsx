"use client"

import { useEffect, useState } from "react"
import { PIN_LENGTH } from "../lib/pin"

interface PinPadProps {
  label: string
  onComplete: (pin: string) => void
  disabled?: boolean
  error?: string | null
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const keyClass =
  "min-h-16 min-w-16 rounded-2xl bg-gray-100 border border-gray-300 text-2xl font-bold text-gray-900 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"

/** 4-digit PIN entry with big keys. Calls onComplete with the digits, then clears itself. */
function PinPad({ label, onComplete, disabled = false, error = null }: PinPadProps) {
  const [digits, setDigits] = useState('')

  const press = (digit: string) => {
    if (disabled || digits.length >= PIN_LENGTH) return
    const next = digits + digit
    if (next.length === PIN_LENGTH) {
      setDigits('')
      onComplete(next)
    } else {
      setDigits(next)
    }
  }
  const backspace = () => setDigits((d) => d.slice(0, -1))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= '0' && event.key <= '9' && event.key.length === 1) press(event.key)
      else if (event.key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="space-y-4 text-center">
      <p id="pin-label" className="text-lg font-bold text-gray-900">{label}</p>
      <div role="status" aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`} className="flex justify-center gap-3">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} aria-hidden className={`h-4 w-4 rounded-full border-2 border-gray-700 ${i < digits.length ? 'bg-gray-900' : 'bg-white'}`} />
        ))}
      </div>
      {error && <p role="alert" className="text-red-700 font-medium">{error}</p>}
      <div role="group" aria-labelledby="pin-label" className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {KEYS.map((key) => (
          <button key={key} type="button" className={keyClass} disabled={disabled} onClick={() => press(key)}>{key}</button>
        ))}
        <span aria-hidden />
        <button type="button" className={keyClass} disabled={disabled} onClick={() => press('0')}>0</button>
        <button type="button" aria-label="Delete last digit" className={keyClass} disabled={disabled} onClick={backspace}>⌫</button>
      </div>
    </div>
  )
}

export default PinPad
