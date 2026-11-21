"use client"

import { useEffect, useId, useState, type ReactNode } from 'react'

interface DoneSectionProps {
  count: number
  /** The child whose list this is; each child remembers on their own whether the section is open. */
  childId: string | null
  children: ReactNode
}

const storageKey = (childId: string | null) => `done-section-open:${childId ?? 'none'}`

// Storage can be missing or blocked (private mode, disabled cookies), so it is never required.
function readOpen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function saveOpen(key: string, open: boolean) {
  try {
    window.localStorage.setItem(key, open ? '1' : '0')
  } catch {
    // Not remembered; the section still works.
  }
}

/** The "Done (N)" dropdown below the task list. Closed by default; open or closed is remembered per child. */
function DoneSection({ count, childId, children }: DoneSectionProps) {
  const key = storageKey(childId)
  const [open, setOpen] = useState(false)
  const listId = useId()

  // Read after mount so the server and the first client render agree (closed).
  useEffect(() => {
    setOpen(readOpen(key))
  }, [key])

  if (count === 0) return null

  const toggle = () => {
    saveOpen(key, !open)
    setOpen(!open)
  }

  return (
    <section className="px-6 pb-6 text-left">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={toggle}
          className="flex w-full items-center justify-between min-h-12 rounded-xl bg-white px-5 text-base font-semibold text-gray-700 border border-gray-100 hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span>Done ({count})</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </h3>
      <div id={listId} hidden={!open}>{open && children}</div>
    </section>
  )
}

export default DoneSection
