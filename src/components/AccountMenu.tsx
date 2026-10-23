"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ChangePinDialog from "./ChangePinDialog"
import { signOut } from "../app/auth/actions"

export interface Account {
  email: string | null
  isAnonymous: boolean
}

/** "D" for demo users, otherwise the first letter of the email. */
export function accountInitial({ email, isAnonymous }: Account): string {
  if (isAnonymous) return 'D'
  return email?.trim().charAt(0).toUpperCase() || '?'
}

const itemClass =
  "block w-full min-h-12 px-4 text-left text-base font-medium text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"

/** Round avatar button in the parent header with a dropdown: email, Change PIN, Sign out. */
function AccountMenu({ account }: { account: Account }) {
  const [open, setOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])
  const closePin = useCallback(() => {
    setPinOpen(false)
    buttonRef.current?.focus()
  }, [])

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

  // Focus the first item when the menu opens.
  useEffect(() => {
    if (open) items()[0]?.focus()
  }, [open])

  // Close when clicking or tabbing away.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const list = items()
    const index = list.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      setOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      list[(index + 1) % list.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      list[(index - 1 + list.length) % list.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      list[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      list[list.length - 1]?.focus()
    }
  }

  const onButtonKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault()
      setOpen(true)
    } else if (event.key === 'Escape' && open) {
      close()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={account.isAnonymous ? 'Account menu, demo account' : `Account menu, ${account.email ?? 'signed in'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-2 min-h-12 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      >
        {account.isAnonymous && <span className="text-base font-medium text-gray-700">Demo</span>}
        <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
          {accountInitial(account)}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <p className="px-4 pt-3 pb-2 text-sm text-gray-600 break-all">
            {account.isAnonymous ? 'Demo account' : account.email ?? 'Signed in'}
          </p>
          <div ref={menuRef} role="menu" aria-label="Account" onKeyDown={onMenuKeyDown} className="border-t border-gray-100">
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => { setOpen(false); setPinOpen(true) }}
            >
              Change PIN
            </button>
            <form action={signOut} role="none">
              <button type="submit" role="menuitem" className={itemClass}>Sign out</button>
            </form>
          </div>
        </div>
      )}

      {pinOpen && <ChangePinDialog onClose={closePin} />}
    </div>
  )
}

export default AccountMenu
