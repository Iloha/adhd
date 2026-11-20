import { describe, it, expect } from 'vitest'
import { groupTasks, isTaskDone } from '../lib/taskGroups'
import type { Task } from '../types'

const step = (done: boolean) => ({ title: 'step', done })

describe('isTaskDone', () => {
  it('is done when every step is done', () => {
    expect(isTaskDone({ id: '1', text: 'a', subtasks: [step(true), step(true)] })).toBe(true)
  })

  it('is not done while any step is open, even if the task says done', () => {
    expect(isTaskDone({ id: '1', text: 'a', done: true, subtasks: [step(true), step(false)] })).toBe(false)
  })

  it('uses `done` for a task without steps', () => {
    expect(isTaskDone({ id: '1', text: 'a', done: true })).toBe(true)
    expect(isTaskDone({ id: '2', text: 'b', done: true, subtasks: [] })).toBe(true)
    expect(isTaskDone({ id: '3', text: 'c', done: false })).toBe(false)
    expect(isTaskDone({ id: '4', text: 'd' })).toBe(false)
  })
})

describe('groupTasks', () => {
  const ids = (list: Task[]) => list.map((t) => t.id)

  it('puts unfinished tasks first and done tasks in their own group', () => {
    const { unfinished, done } = groupTasks([
      { id: '1', text: 'a', done: true },
      { id: '2', text: 'b', done: false },
      { id: '3', text: 'c', subtasks: [step(true)] },
      { id: '4', text: 'd', subtasks: [step(true), step(false)] },
    ])
    expect(ids(unfinished)).toEqual(['2', '4'])
    expect(ids(done)).toEqual(expect.arrayContaining(['1', '3']))
    expect(done).toHaveLength(2)
  })

  it('keeps the current order inside the unfinished group', () => {
    const { unfinished } = groupTasks([
      { id: 'c', text: 'c', created_at: '2026-01-01' },
      { id: 'a', text: 'a', created_at: '2026-03-01' },
      { id: 'b', text: 'b', created_at: '2026-02-01' },
    ])
    expect(ids(unfinished)).toEqual(['c', 'a', 'b'])
  })

  it('lists done tasks newest first', () => {
    const { done } = groupTasks([
      { id: 'old', text: 'old', done: true, created_at: '2026-01-01T10:00:00Z' },
      { id: 'new', text: 'new', done: true, created_at: '2026-03-01T10:00:00Z' },
      { id: 'mid', text: 'mid', done: true, created_at: '2026-02-01T10:00:00Z' },
    ])
    expect(ids(done)).toEqual(['new', 'mid', 'old'])
  })

  it('keeps the list order for done tasks without a creation time', () => {
    const { done } = groupTasks([
      { id: 'x', text: 'x', done: true },
      { id: 'y', text: 'y', done: true },
    ])
    expect(ids(done)).toEqual(['x', 'y'])
  })

  it('does not change the list it is given', () => {
    const list: Task[] = [
      { id: '1', text: 'a', done: true, created_at: '2026-01-01' },
      { id: '2', text: 'b', done: false },
      { id: '3', text: 'c', done: true, created_at: '2026-02-01' },
    ]
    groupTasks(list)
    expect(ids(list)).toEqual(['1', '2', '3'])
  })

  it('handles an empty list', () => {
    expect(groupTasks([])).toEqual({ unfinished: [], done: [] })
  })
})
