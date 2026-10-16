import type { ReactNode } from 'react'
import { render, renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppProvider, useApp } from '../context/AppContext'
import { TasksProvider, useTasks } from '../context/TasksContext'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../lib/supabaseClient', () => ({ supabase: { from } }))

type Result = { data?: unknown; error?: unknown }

// Builds a chainable, awaitable stand-in for a Supabase query builder.
function query(result: Result) {
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'order', 'insert', 'update', 'delete', 'eq', 'single']) {
    q[m] = vi.fn(() => q)
  }
  q.then = (resolve: (r: Result) => unknown) => resolve(result)
  return q
}

const tasks = [
  { id: '1', text: 'Done one', done: true, subtasks: [] },
  { id: '2', text: 'Second', done: false, subtasks: [] },
  { id: '3', text: 'Third', done: false, subtasks: [] },
]

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <TasksProvider>{children}</TasksProvider>
    </AppProvider>
  )
}

async function setup(initial: Result = { data: tasks, error: null }) {
  from.mockReturnValueOnce(query(initial))
  const hook = renderHook(() => ({ ...useTasks(), app: useApp() }), { wrapper })
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

beforeEach(() => {
  from.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('TasksProvider', () => {
  it('loads tasks and stops loading', async () => {
    const { result } = await setup()
    expect(result.current.tasks).toEqual(tasks)
    expect(result.current.error).toBeNull()
    expect(from).toHaveBeenCalledWith('tasks')
  })

  it('is loading before the first fetch finishes', () => {
    from.mockReturnValueOnce({ select: () => ({ order: () => new Promise(() => {}) }) })
    const { result } = renderHook(() => useTasks(), { wrapper })
    expect(result.current.loading).toBe(true)
  })

  it('exposes an error when loading fails', async () => {
    const { result } = await setup({ data: null, error: { message: 'nope' } })
    expect(result.current.tasks).toEqual([])
    expect(result.current.error).toMatch(/failed to load/i)
  })

  it('selects the first unfinished task as the active task', async () => {
    const { result } = await setup()
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('2'))
    expect(result.current.activeTask?.text).toBe('Second')
  })

  it('treats a task with all subtasks done as finished', async () => {
    const data = [
      { id: 'a', text: 'A', done: false, subtasks: [{ title: 's', done: true }] },
      { id: 'b', text: 'B', done: false, subtasks: [{ title: 's', done: false }] },
    ]
    const { result } = await setup({ data, error: null })
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('b'))
  })

  it('adds a task to the list', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ data: { id: '4', text: 'New', subtasks: [] }, error: null }))
    await act(() => result.current.addTask({ text: 'New' }))
    expect(result.current.tasks.map(t => t.id)).toEqual(['1', '2', '3', '4'])
  })

  it('shows an error when adding fails and keeps the list', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ data: null, error: { message: 'x' } }))
    await act(() => result.current.addTask({ text: 'New' }))
    expect(result.current.error).toMatch(/failed to add/i)
    expect(result.current.tasks).toHaveLength(3)
  })

  it('deletes a task from the list', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ error: null }))
    await act(() => result.current.deleteTask('2'))
    expect(result.current.tasks.map(t => t.id)).toEqual(['1', '3'])
  })

  it('shows an error when deleting fails and keeps the task', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ error: { message: 'x' } }))
    await act(() => result.current.deleteTask('2'))
    expect(result.current.error).toMatch(/failed to delete/i)
    expect(result.current.tasks).toHaveLength(3)
  })

  it('updates a task with the row returned by the database', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ data: { id: '2', text: 'Renamed', done: false, subtasks: [] }, error: null }))
    await act(() => result.current.updateTask('2', { text: 'Renamed' }))
    expect(result.current.tasks.find(t => t.id === '2')?.text).toBe('Renamed')
  })

  it('shows an error when updating fails', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ data: null, error: { message: 'x' } }))
    await act(() => result.current.updateTask('2', { text: 'Renamed' }))
    expect(result.current.error).toMatch(/failed to update/i)
    expect(result.current.tasks.find(t => t.id === '2')?.text).toBe('Second')
  })

  it('toggles a task done', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ error: null }))
    await act(() => result.current.markDone('2'))
    expect(result.current.tasks.find(t => t.id === '2')?.done).toBe(true)
  })

  it('shows an error when marking done fails and leaves the task alone', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ error: { message: 'x' } }))
    await act(() => result.current.markDone('2'))
    expect(result.current.error).toMatch(/failed to update/i)
    expect(result.current.tasks.find(t => t.id === '2')?.done).toBe(false)
  })

  it('clears a previous error after a successful action', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ error: { message: 'x' } }))
    await act(() => result.current.deleteTask('2'))
    expect(result.current.error).not.toBeNull()
    from.mockReturnValueOnce(query({ error: null }))
    await act(() => result.current.deleteTask('2'))
    expect(result.current.error).toBeNull()
  })
})

describe('hooks outside providers', () => {
  it('useTasks throws a helpful error', () => {
    const Probe = () => { useTasks(); return null }
    expect(() => render(<Probe />)).toThrow(/TasksProvider/)
  })
})
