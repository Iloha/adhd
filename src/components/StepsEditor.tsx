"use client"

import type { Subtask } from "../types"

export type StepRow = Subtask & { key: string }

let nextKey = 0
export function newKey() {
  nextKey += 1
  return `step-${nextKey}`
}

export function toRows(steps: Subtask[]): StepRow[] {
  return steps.map((step) => ({ ...step, key: newKey() }))
}

/** Drops the editor-only key and blank steps, and omits empty optional fields. */
export function fromRows(rows: StepRow[]): Subtask[] {
  return rows
    .filter((row) => row.title.trim() !== "")
    .map((step) => {
      const clean: Subtask = { title: step.title.trim(), hint: step.hint ?? "", done: step.done }
      if (step.minutes) clean.minutes = step.minutes
      if (step.emoji) clean.emoji = step.emoji
      return clean
    })
}

const inputClass =
  "w-full min-h-12 text-base py-2 px-3 rounded-xl bg-white border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700"
const iconButtonClass =
  "flex items-center justify-center min-w-12 min-h-12 rounded-xl text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"

interface StepsEditorProps {
  rows: StepRow[]
  onChange: (rows: StepRow[]) => void
}

function StepsEditor({ rows, onChange }: StepsEditorProps) {
  const update = (index: number, changes: Partial<Subtask>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)))

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index))

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  if (rows.length === 0) return null

  return (
    <ol className="space-y-3 text-left">
      {rows.map((row, index) => {
        const n = index + 1
        return (
          <li key={row.key} className="bg-gray-100 rounded-2xl p-3 space-y-2 border border-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-6 text-center font-bold text-gray-700" aria-hidden>{n}</span>
              <input
                aria-label={`Step ${n} emoji`}
                className={`${inputClass} !w-16 text-center text-xl`}
                value={row.emoji ?? ""}
                maxLength={8}
                onChange={(e) => update(index, { emoji: e.target.value })}
              />
              <input
                aria-label={`Step ${n} title`}
                className={inputClass}
                value={row.title}
                onChange={(e) => update(index, { title: e.target.value })}
              />
            </div>
            <input
              aria-label={`Step ${n} hint`}
              className={inputClass}
              placeholder="Hint (optional)"
              value={row.hint ?? ""}
              onChange={(e) => update(index, { hint: e.target.value })}
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-base text-gray-700">
                <span>~</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  aria-label={`Step ${n} minutes`}
                  className={`${inputClass} !w-20`}
                  value={row.minutes ?? ""}
                  onChange={(e) => update(index, { minutes: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
                <span>min</span>
              </label>
              <div className="flex items-center">
                <button type="button" aria-label={`Move step ${n} up`} className={iconButtonClass} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                <button type="button" aria-label={`Move step ${n} down`} className={iconButtonClass} disabled={index === rows.length - 1} onClick={() => move(index, 1)}>↓</button>
                <button type="button" aria-label={`Delete step ${n}`} className={`${iconButtonClass} text-red-700`} onClick={() => remove(index)}>✕</button>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function StepsSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <span className="sr-only">Thinking up steps...</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} aria-hidden className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  )
}

export default StepsEditor
