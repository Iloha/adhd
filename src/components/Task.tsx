"use client"

import { useCallback, useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react'
import TaskMenu from './TaskMenu'
import type { Task as TaskType } from '../types'

interface TaskProps {
  task: TaskType
  /** Adds a Delete action to the "⋯" menu. */
  onDelete?: (id: string) => void
  /** Adds an Archive action to the menu. */
  onArchive?: (id: string) => void
  onEdit: (id: string) => void
  /** Scrolls the task into view and flashes it, e.g. right after it was created. */
  highlighted?: boolean
  /** Set by the sortable list: makes the card draggable through a handle. */
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void
    style: CSSProperties
    handleProps: HTMLAttributes<HTMLButtonElement>
    isDragging: boolean
  }
}

function Task ({task, onDelete, onArchive, onEdit, highlighted = false, sortable}: TaskProps) {
  const ref = useRef<HTMLLIElement | null>(null)
  // Must keep the same identity between renders: a new function makes React call it with
  // null and then the node again on every render, and dnd-kit re-measures the card each time.
  const setNodeRef = sortable?.setNodeRef
  const setRefs = useCallback((node: HTMLLIElement | null) => {
    ref.current = node
    setNodeRef?.(node)
  }, [setNodeRef])

  useEffect(() => {
    if (!highlighted) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView?.({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [highlighted])

  const completed = task.subtasks ? task.subtasks.filter(s => s.done).length : 0
  const total = task.subtasks ? task.subtasks.length : 0
  const isDone = total > 0 ? completed === total : false
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <li ref={setRefs} style={sortable?.style} data-highlighted={highlighted || undefined} className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-all ${sortable?.isDragging ? "relative z-10 shadow-lg ring-2 ring-blue-500" : ""} ${highlighted ? "motion-safe:animate-highlight motion-reduce:ring-4 motion-reduce:ring-yellow-400" : ""}`} key={task.id}>
      
      <div className='flex items-start justify-between mb-3'>
        <h3 className='text-lg font-bold text-gray-900'>{task.text}</h3>
        <div className="flex items-center gap-2">
          { sortable && (
            <button type="button" aria-label={`Reorder ${task.text}`} title="Drag to reorder" {...sortable.handleProps} className="flex items-center justify-center min-w-12 min-h-12 text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus-visible:text-gray-800 rounded-lg cursor-grab touch-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5"><path d="M12 2v20"/><path d="m8 18 4 4 4-4"/><path d="m8 6 4-4 4 4"/></svg>
            </button>
          )}
          { percent > 0 && (
          (isDone) ? (
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">Done</span>
          ) : (
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">In progress</span>
          ) )}
          <TaskMenu taskName={task.text} onEdit={() => onEdit(task.id)} onArchive={onArchive && (() => onArchive(task.id))} onDelete={onDelete && (() => onDelete(task.id))} />
        </div>
      </div>
     
      <p className='text-base text-gray-600 mb-2'>{ completed } / { total } steps completed</p>

      {/* progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

    </li>
  )
}

export default Task

// {tasks ? tasks.filter(t => t.done).length : 0}