"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { useApp } from "../context/AppContext"
import ErrorBanner from "./ErrorBanner"
import { isTaskDone } from "../lib/taskGroups"
import StepsEditor, { StepsSkeleton, fromRows, toRows, type StepRow } from "./StepsEditor"
import type { NewTask, SaveResult, Subtask, Task } from "../types"

interface AddTaskProps {
  onAdd: (task: NewTask) => Promise<SaveResult> | void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<SaveResult> | void
  mode: 'create' | 'edit'
  tasks: Task[]
  setScreen: (screen: 'tasks' | 'createTask') => void
  /** Called after a successful save, so the parent can show a confirmation. */
  onSaved?: (info: { mode: 'create' | 'edit'; name: string; id?: string }) => void
}

const BLANK_STEP_MESSAGE = "Every step needs a name."
const SAVE_FAILED_MESSAGE = "Couldn't save the task. Please try again."


const RATE_LIMIT_MESSAGE = "Too many requests, try again in a minute"
const GENERIC_AI_MESSAGE = "Couldn't suggest steps right now. You can add steps yourself."
const MAX_TASK_LENGTH = 100

function Addtext({ onAdd, onUpdate, mode, tasks, setScreen, onSaved }: AddTaskProps) {
  const { activeTaskId } = useApp()
  const editTask = mode === 'edit' ? tasks?.find(t => t.id === activeTaskId) : null

  // A done task keeps its steps and their checkmarks: only the wording can be fixed (use "Do again" for a fresh run).
  const textOnly = Boolean(editTask && isTaskDone(editTask))

  const [text, setText] = useState('')
  const [hint, setHint] = useState('')
  const [rows, setRows] = useState<StepRow[]>([])
  const [subtask, setSubtask] = useState('')
  const [subtaskHint, setSubtaskHint] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // A ref, not state: state updates are async, so a fast double click could slip through.
  const savingRef = useRef(false)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  useEffect(() => {
    if (editTask) {
      setText(editTask.text ?? '')
      setHint(editTask.hint ?? '')
      setRows(toRows(editTask.subtasks ?? []))
    }
    // Only re-fill the form when a different task is opened. Depending on the whole
    // `editTask` would reset what the user is typing each time the task list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTask?.id])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (savingRef.current) return
    // An emptied step would be dropped from the task, which a done task must not lose.
    if (textOnly && rows.some((row) => row.title.trim() === '')) {
      setSaveError(BLANK_STEP_MESSAGE)
      return
    }
    savingRef.current = true
    setSaving(true)
    setSaveError(null)

    const subtasks = fromRows(rows)
    try {
      const result = mode === 'edit'
        ? await onUpdate(activeTaskId as string, { text, hint, subtasks })
        : await onAdd({ text, hint, subtasks })

      // A failure keeps the form as it is so nothing the user typed is lost.
      if (result && !result.ok) {
        setSaveError(result.error)
        return
      }
      const id = result?.ok ? result.task.id : undefined
      setAiError(null)
      onSaved?.({ mode, name: text, id })
      setScreen('tasks')
    } catch (error) {
      console.error('Error saving task:', error)
      setSaveError(SAVE_FAILED_MESSAGE)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const addSubtask = (subtask: string) => {
    const newSubtask: Subtask = { title: subtask, hint: subtaskHint, done: false }
    setRows([...rows, ...toRows([newSubtask])])
    setSubtask('')
    setSubtaskHint('')
  }

  const suggestSteps = async () => {
    const task = text.trim()
    if (!task) return
    if (task.length > MAX_TASK_LENGTH) {
      setAiError(`Task name is too long to suggest steps for (max ${MAX_TASK_LENGTH} characters).`)
      return
    }

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setSuggesting(true)
    setAiError(null)

    try {
      const res = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task }),
        signal: controller.signal,
      })
      const data = await res.json().catch(() => null)
      if (controller.signal.aborted) return

      if (res.ok && Array.isArray(data?.steps)) {
        const steps: Subtask[] = data.steps.map((s: Subtask) => ({
          title: s.title, hint: s.hint, minutes: s.minutes, emoji: s.emoji, done: false,
        }))
        setRows(toRows(steps))
      } else if (res.status === 429) {
        setAiError(RATE_LIMIT_MESSAGE)
      } else if ([400, 401, 403, 422, 503, 504].includes(res.status) && typeof data?.error === 'string') {
        setAiError(data.error)
      } else {
        setAiError(GENERIC_AI_MESSAGE)
      }
    } catch {
      if (!controller.signal.aborted) setAiError(GENERIC_AI_MESSAGE)
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setSuggesting(false)
      }
    }
  }

  const hasSteps = rows.length > 0
  const button_text = mode === 'edit' ? 'Save changes' : 'Create task'
  return (
      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        <form onSubmit={onSubmit} className="space-y-8">
          <fieldset className="space-y-3 text-left"> 
            <label htmlFor="task-text" className="block text-lg font-bold text-gray-900">Task name<span className="text-red-700">*</span></label>
            <input id="task-text" type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" placeholder="e.g., Clean your room" value={text} onChange={(e)=>setText(e.target.value)}/>
            {!textOnly && <button
              type="button"
              onClick={suggestSteps}
              disabled={suggesting || text.trim() === ''}
              className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-12 px-5 py-2 rounded-xl border border-purple-300 bg-purple-50 text-purple-900 text-base font-medium hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggesting ? 'Thinking...' : hasSteps ? '✨ Regenerate' : '✨ Suggest steps'}
            </button>}
          </fieldset>

          <fieldset className="space-y-3 text-left"> 
            <label htmlFor="task-hint" className="block text-lg font-bold text-gray-900">Hint (optional)</label>
            <input id="task-hint" type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" placeholder="e.g., Check under your bed" value={hint} onChange={(e)=>setHint(e.target.value)}/>
          </fieldset>


          {textOnly && (
            <p role="note" className="text-left text-base text-gray-700 bg-gray-100 rounded-2xl p-4">
              This task is done, so you can fix its wording. To change or add steps, use “Do again” to make a fresh copy.
            </p>
          )}
          {suggesting && <StepsSkeleton />}
          {!suggesting && <StepsEditor rows={rows} onChange={setRows} textOnly={textOnly} />}
          <ErrorBanner message={aiError} />

          {!textOnly && <fieldset className="space-y-3 text-left">
            <label htmlFor="subtask-title" className="block text-lg font-bold text-gray-900">Subtask name</label>
            <input id="subtask-title" type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" placeholder="e.g., Pick up your toys" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
            <input type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" value={subtaskHint} onChange={(e)=>setSubtaskHint(e.target.value)} aria-label="Subtask hint" placeholder="Hint (optional)" />
            <button type="button"  className="flex items-center gap-2 min-h-12 px-4 py-2 text-base font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => addSubtask(subtask)}>+ Add subtask</button>
          </fieldset>}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-medium py-5 rounded-2xl transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : button_text}
            </button>
            <ErrorBanner message={saveError} />
          </div>
        </form>
      </div>
  )
}

export default Addtext
