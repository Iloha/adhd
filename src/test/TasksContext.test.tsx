import type { ReactNode } from 'react'
import { render, renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppProvider, useApp } from '../context/AppContext'
import { TasksProvider, useTasks } from '../context/TasksContext'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../lib/supabase/client', () => ({ createClient: () => ({ from }) }))

type Result = { data?: unknown; error?: unknown }

// Builds a chainable, awaitable stand-in for a Supabase query builder.
function query(result: Result) {
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'order', 'insert', 'update', 'delete', 'eq', 'is', 'single']) {
    q[m] = vi.fn(() => q)
  }
  q.then = (resolve: (r: Result) => unknown) => resolve(result)
  return q
}

const tasks = [
  { id: '1', text: 'Done one', done: true, subtasks: [], position: 0 },
  { id: '2', text: 'Second', done: false, subtasks: [], position: 1 },
  { id: '3', text: 'Third', done: false, subtasks: [], position: 2 },
]

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <TasksProvider>{children}</TasksProvider>
    </AppProvider>
  )
}

type Query = ReturnType<typeof query>

// The provider loads children first, then the selected child's tasks.
// Action calls in the tests use mockReturnValueOnce, which takes priority over this.
async function setup(
  initial: Result = { data: tasks, error: null },
  childProfiles: Result = { data: [], error: null },
) {
  taskQueries = []
  from.mockImplementation((table: string) => {
    if (table === 'children') return query(childProfiles)
    const q = query(initial)
    taskQueries.push(q)
    return q
  })
  const hook = renderHook(() => ({ ...useTasks(), app: useApp() }), { wrapper })
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

let taskQueries: Query[] = []

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

describe('TasksProvider - child profiles', () => {
  const kids = [
    { id: 'c1', name: 'Alex', avatar: '🦊' },
    { id: 'c2', name: 'Sam', avatar: '🐼' },
  ]

  it('exposes the children and selects the first one', async () => {
    const { result } = await setup(undefined, { data: kids, error: null })
    expect(result.current.children).toEqual(kids)
    expect(result.current.selectedChildId).toBe('c1')
  })

  it("loads only the selected child's tasks", async () => {
    await setup(undefined, { data: kids, error: null })
    const q = taskQueries[taskQueries.length - 1]
    expect(q.eq).toHaveBeenCalledWith('child_id', 'c1')
    expect(q.is).not.toHaveBeenCalled()
  })

  it('loads tasks that have no child when the family has no child profiles', async () => {
    const { result } = await setup()
    expect(result.current.selectedChildId).toBeNull()
    const q = taskQueries[taskQueries.length - 1]
    expect(q.is).toHaveBeenCalledWith('child_id', null)
    expect(q.eq).not.toHaveBeenCalled()
  })

  it('reloads tasks and resets the active task when another child is selected', async () => {
    const { result } = await setup(undefined, { data: kids, error: null })
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('2'))
    await act(async () => result.current.setSelectedChildId('c2'))
    await waitFor(() => expect(taskQueries.some((q) => (q.eq as ReturnType<typeof vi.fn>).mock.calls.some((c) => c[1] === 'c2'))).toBe(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.selectedChildId).toBe('c2')
  })

  it('adds new tasks to the selected child and never sends a user_id', async () => {
    const { result } = await setup(undefined, { data: kids, error: null })
    const insertQuery = query({ data: { id: '9', text: 'New', child_id: 'c1', subtasks: [] }, error: null })
    from.mockReturnValueOnce(insertQuery)
    await act(() => result.current.addTask({ text: 'New' }))
    expect(insertQuery.insert).toHaveBeenCalledWith({ text: 'New', child_id: 'c1', position: 3 })
    expect(JSON.stringify((insertQuery.insert as ReturnType<typeof vi.fn>).mock.calls)).not.toContain('user_id')
  })

  it('adds a task with no child when none is selected', async () => {
    const { result } = await setup()
    const insertQuery = query({ data: { id: '9', text: 'New', subtasks: [] }, error: null })
    from.mockReturnValueOnce(insertQuery)
    await act(() => result.current.addTask({ text: 'New' }))
    expect(insertQuery.insert).toHaveBeenCalledWith({ text: 'New', child_id: null, position: 3 })
  })

  it('loads tasks ordered by position, then created_at', async () => {
    await setup()
    const q = taskQueries[0]
    expect((q.order as ReturnType<typeof vi.fn>).mock.calls).toEqual([
      ['position', { ascending: true }],
      ['created_at', { ascending: true }],
    ])
  })

  it('puts a new task after the highest position, even when positions have gaps', async () => {
    const gappy = tasks.map((t, i) => ({ ...t, position: i * 10 }))
    const { result } = await setup({ data: gappy, error: null })
    const insertQuery = query({ data: { id: '9', text: 'New', subtasks: [], position: 21 }, error: null })
    from.mockReturnValueOnce(insertQuery)
    await act(() => result.current.addTask({ text: 'New' }))
    expect(insertQuery.insert).toHaveBeenCalledWith({ text: 'New', child_id: null, position: 21 })
    expect(result.current.tasks.at(-1)?.id).toBe('9')
  })

  it('reorderTasks saves the new position of every task that moved, and only those', async () => {
    const { result } = await setup()
    const updates = [query({ data: [{ id: '3' }], error: null }), query({ data: [{ id: '2' }], error: null })]
    from.mockReturnValueOnce(updates[0]).mockReturnValueOnce(updates[1])
    // Move task 3 to the middle: 1, 3, 2 -> tasks 3 and 2 change position.
    let ok = false
    await act(async () => { ok = await result.current.reorderTasks(['1', '3', '2']) })
    expect(ok).toBe(true)
    expect(result.current.tasks.map((t) => [t.id, t.position])).toEqual([['1', 0], ['3', 1], ['2', 2]])
    expect(updates[0].update).toHaveBeenCalledWith({ position: 1 })
    expect(updates[0].eq).toHaveBeenCalledWith('id', '3')
    expect(updates[1].update).toHaveBeenCalledWith({ position: 2 })
    expect(updates[1].eq).toHaveBeenCalledWith('id', '2')
    expect(result.current.error).toBeNull()
  })

  it('reorderTasks makes the active task the first unfinished one in the new order', async () => {
    const { result } = await setup()
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('2'))
    from.mockReturnValue(query({ data: [{ id: 'x' }], error: null }))
    await act(async () => { await result.current.reorderTasks(['3', '2', '1']) })
    // Child mode must open on the first task of the new order, not on the one that was active before.
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('3'))
    expect(result.current.activeTask?.id).toBe('3')
  })

  it('reorderTasks restores the old order and shows an error when saving fails', async () => {
    const { result } = await setup()
    from.mockReturnValueOnce(query({ data: null, error: { message: 'nope' } })).mockReturnValueOnce(query({ data: [{ id: '2' }], error: null }))
    let ok = true
    await act(async () => { ok = await result.current.reorderTasks(['3', '2', '1']) })
    expect(ok).toBe(false)
    expect(result.current.tasks.map((t) => t.id)).toEqual(['1', '2', '3'])
    expect(result.current.error).toMatch(/new order/i)
  })

  it('reorderTasks treats an update that changed no rows as a failure and restores the order', async () => {
    const { result } = await setup()
    // No error, but no row came back: what Supabase does when row-level security blocks an update.
    from.mockReturnValue(query({ data: [], error: null }))
    let ok = true
    await act(async () => { ok = await result.current.reorderTasks(['3', '2', '1']) })
    expect(ok).toBe(false)
    expect(result.current.tasks.map((t) => t.id)).toEqual(['1', '2', '3'])
    expect(result.current.error).toMatch(/new order/i)
  })

  it('reorderTasks ignores an id list that does not match the loaded tasks', async () => {
    const { result } = await setup()
    const callsBefore = from.mock.calls.length
    let ok = true
    await act(async () => { ok = await result.current.reorderTasks(['1', '2']) })
    expect(ok).toBe(false)
    expect(from.mock.calls.length).toBe(callsBefore)
    expect(result.current.tasks.map((t) => t.id)).toEqual(['1', '2', '3'])
  })

  it('never makes an archived task the active task', async () => {
    const withArchived = [
      { id: '1', text: 'Archived first', done: false, subtasks: [], position: 0, archived: true },
      { id: '2', text: 'Open', done: false, subtasks: [], position: 1 },
    ]
    const { result } = await setup({ data: withArchived, error: null })
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('2'))
    expect(result.current.activeTask?.id).toBe('2')
  })

  it('has no active task when every task is archived', async () => {
    const all = [{ id: '1', text: 'Archived', done: false, subtasks: [], position: 0, archived: true }]
    const { result } = await setup({ data: all, error: null })
    expect(result.current.activeTask).toBeUndefined()
    expect(result.current.app.activeTaskId).toBeNull()
  })

  it('falls back to an open task if the active id points at an archived one', async () => {
    const { result } = await setup()
    await waitFor(() => expect(result.current.app.activeTaskId).toBe('2'))
    from.mockReturnValueOnce(query({ data: { ...tasks[1], archived: true }, error: null }))
    await act(async () => { await result.current.updateTask('2', { archived: true }) })
    expect(result.current.activeTask?.id).toBe('3')
  })

  it('reorders the visible tasks and keeps archived ones at the end', async () => {
    const mixed = [
      { id: '1', text: 'One', done: false, subtasks: [], position: 0 },
      { id: '2', text: 'Archived', done: false, subtasks: [], position: 1, archived: true },
      { id: '3', text: 'Three', done: false, subtasks: [], position: 2 },
    ]
    const { result } = await setup({ data: mixed, error: null })
    const updates = [query({ data: [{ id: '3' }], error: null }), query({ data: [{ id: '1' }], error: null }), query({ data: [{ id: '2' }], error: null })]
    updates.forEach((u) => from.mockReturnValueOnce(u))
    let ok = false
    await act(async () => { ok = await result.current.reorderTasks(['3', '1']) })
    expect(ok).toBe(true)
    expect(result.current.tasks.map((t) => [t.id, t.position])).toEqual([['3', 0], ['1', 1], ['2', 2]])
  })

  it('does not accept a reorder that includes an archived task', async () => {
    const mixed = [
      { id: '1', text: 'One', done: false, subtasks: [], position: 0 },
      { id: '2', text: 'Archived', done: false, subtasks: [], position: 1, archived: true },
    ]
    const { result } = await setup({ data: mixed, error: null })
    const callsBefore = from.mock.calls.length
    let ok = true
    await act(async () => { ok = await result.current.reorderTasks(['2', '1']) })
    expect(ok).toBe(false)
    expect(from.mock.calls.length).toBe(callsBefore)
  })

  it('shows an error when the children cannot be loaded', async () => {
    const { result } = await setup(undefined, { data: null, error: { message: 'nope' } })
    expect(result.current.error).toMatch(/failed to load/i)
  })
})

describe('hooks outside providers', () => {
  it('useTasks throws a helpful error', () => {
    const Probe = () => { useTasks(); return null }
    expect(() => render(<Probe />)).toThrow(/TasksProvider/)
  })
})
