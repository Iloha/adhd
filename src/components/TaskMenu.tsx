"use client"

import { useEffect, useRef, useState } from 'react'

interface TaskMenuProps {
  taskName: string
  onEdit: () => void
  /** Leave out to hide the Archive action. */
  onArchive?: () => void
  /** Leave out to hide the Delete action. */
  onDelete?: () => void
}

const itemClass = 'flex w-full items-center gap-2 min-h-12 whitespace-nowrap rounded-lg px-3 text-left text-base font-medium focus-visible:outline-none focus-visible:ring-2'

/** A "⋯" button that opens a small menu of actions for one task. */
function TaskMenu({ taskName, onEdit, onArchive, onDelete }: TaskMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    menu.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
    // Click or tap anywhere else closes the menu.
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) trigger.current?.focus()
  }

  return (
    <div
      ref={wrapper}
      className="relative"
      onKeyDown={(event) => {
        if (!open) return
        if (event.key === 'Escape') {
          event.stopPropagation()
          close(true)
          return
        }
        // Arrow keys, Home and End move between the menu items.
        const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])
        const current = items.indexOf(document.activeElement as HTMLElement)
        const target = { ArrowDown: (current + 1) % items.length, ArrowUp: (current - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[event.key]
        if (target === undefined || items.length === 0) return
        event.preventDefault()
        items[target].focus()
      }}
      // Tabbing out of the menu closes it.
      onBlur={(event) => {
        if (open && !wrapper.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`Actions for ${taskName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-center min-w-12 min-h-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
      </button>
      {open && (
        <div ref={menu} role="menu" aria-label={`Actions for ${taskName}`} className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={() => { close(false); onEdit() }}
            className={`${itemClass} text-gray-900 hover:bg-gray-100 focus-visible:ring-blue-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
            Edit task
          </button>
          {onArchive && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { close(false); onArchive() }}
              className={`${itemClass} text-gray-900 hover:bg-gray-100 focus-visible:ring-blue-600`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
              Archive task
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { close(false); onDelete() }}
              className={`${itemClass} text-red-700 hover:bg-red-50 focus-visible:ring-red-600`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskMenu
