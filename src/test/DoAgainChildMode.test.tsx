import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { AppProvider } from '../context/AppContext'
import { TasksProvider, useTasks } from '../context/TasksContext'
import ChildPage from '../app/child/page'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../lib/supabase/client', () => ({ createClient: () => ({ from }) }))
vi.mock('../components/ParentLock', () => ({ default: () => null }))
vi.mock('../components/Header', () => ({ default: () => null }))

type Result = { data?: unknown; error?: unknown }

// A chainable, awaitable stand-in for a Supabase query builder.
function query(result: Result) {
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'order', 'insert', 'update', 'delete', 'eq', 'is', 'single', 'maybeSingle']) q[m] = vi.fn(() => q)
  q.then = (resolve: (r: Result) => unknown) => resolve(result)
  return q
}

const step = (title: string, done: boolean) => ({ title, hint: `Hint for ${title}`, done })
const original = { id: '1', text: 'Pack bag', done: true, position: 0, subtasks: [step('Books', true), step('Lunch', true)] }
const other = { id: '2', text: 'Tidy desk', done: false, position: 1, subtasks: [step('Papers', false)] }
// What the database returns for the copy: new id, last position, everything unchecked.
const copy = { id: '9', text: 'Pack bag', done: false, position: 2, subtasks: [step('Books', false), step('Lunch', false)] }

// Copies a task in the parent's session, then shows child mode with the same provider (as the real app does).
function Session() {
  const { duplicateTask } = useTasks()
  return (
    <>
      <button onClick={() => duplicateTask('1')}>copy task</button>
      <ChildPage />
    </>
  )
}

async function start(loaded: unknown[]) {
  from.mockImplementation((table: string) => query(table === 'children' ? { data: [], error: null } : { data: loaded, error: null }))
  render(<AppProvider><TasksProvider><Session /></TasksProvider></AppProvider>)
  await screen.findByRole('button', { name: 'copy task' })
}

const copyTask = async (row: unknown) => {
  from.mockReturnValueOnce(query({ data: row, error: null }))
  await userEvent.click(screen.getByRole('button', { name: 'copy task' }))
}

beforeEach(() => {
  from.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('child mode after "Do again"', () => {
  it('shows the copy as a normal unfinished task, not the done original', async () => {
    await start([original])
    // Only a done task: child mode would show its "Great job" screen.
    expect(await screen.findByText('Great job!')).toBeInTheDocument()
    await copyTask(copy)
    expect(await screen.findByText('Books')).toBeInTheDocument()
    expect(screen.getByText('Pack bag')).toBeInTheDocument()
    expect(screen.getByText('1 / 2 steps')).toBeInTheDocument()
    expect(screen.getByText('Hint for Books')).toBeInTheDocument()
    expect(screen.queryByText('Great job!')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument()
  })

  it('keeps the existing order: open tasks first, the copy after them, the done original skipped', async () => {
    await start([original, other])
    expect(await screen.findByText('Papers')).toBeInTheDocument()
    await copyTask(copy)
    // Back on the first unfinished task in the saved order, not on the copy yet. (The provider picks it in an effect, so wait for it.)
    await waitFor(() => expect(screen.getByText('Papers')).toBeInTheDocument())
    expect(screen.queryByText('Books')).not.toBeInTheDocument()

    from.mockReturnValueOnce(query({ data: { ...other, done: true, subtasks: [step('Papers', true)] }, error: null }))
    await userEvent.click(screen.getByRole('button', { name: 'Complete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Next task' }))
    // Next task is the copy (the done original is skipped).
    expect(await screen.findByText('Books')).toBeInTheDocument()
    expect(screen.queryByText('Great job!')).not.toBeInTheDocument()
  })

  it('shows a copy that was loaded from the database the same way', async () => {
    await start([original, copy])
    expect(await screen.findByText('Books')).toBeInTheDocument()
    expect(screen.getByText('1 / 2 steps')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Great job!')).not.toBeInTheDocument())
  })
})
