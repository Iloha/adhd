"use client"

import { useId, useState } from 'react'
import type { Task } from '../types'

interface ArchivedTasksProps {
  tasks: Task[]
  onRestore: (id: Task['id']) => void
}

/** A dropdown at the bottom of the list with the archived tasks, each with a Restore button. */
function ArchivedTasks({ tasks, onRestore }: ArchivedTasksProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  if (tasks.length === 0) return null

  return (
    <section className="px-6 pb-6 text-left" aria-label="Archived tasks">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between min-h-12 rounded-xl bg-white px-5 text-base font-semibold text-gray-700 border border-gray-100 hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <span>Archived ({tasks.length})</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && (
        <ul id={listId} className="mt-3 space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 border border-gray-100 py-2 pl-5 pr-2">
              <span className="text-base text-gray-700 break-words">{task.text}</span>
              <button
                type="button"
                aria-label={`Restore ${task.text}`}
                onClick={() => onRestore(task.id)}
                className="min-h-12 shrink-0 rounded-lg px-4 text-base font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ArchivedTasks
