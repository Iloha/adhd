import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ParentScreen from '../screens/ParentScreen'
import Toast from '../components/Toast'
import { renderWithContext } from './helpers'
import type { NewTask, SaveResult, Task } from '../types'

vi.mock('../app/parent/actions', () => ({ getPinStatus: vi.fn(), setPin: vi.fn(), startChildMode: vi.fn() }))
vi.mock('../app/auth/actions', () => ({ signOut: vi.fn() }))

const existing: Task = { id: '1', text: 'Make bed', done: false, subtasks: [] }

/** Behaves like the real provider: a save is async, and a successful add puts the task in the list. */
function Harness({ add, update }: { add: (task: NewTask) => Promise<SaveResult>; update?: (id: string, u: Partial<Task>) => Promise<SaveResult> }) {
  const [tasks, setTasks] = useState<Task[]>([existing])
  const addTask = async (task: NewTask) => {
    const result = await add(task)
    if (result.ok) setTasks((prev) => [...prev, result.task])
    return result
  }
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const result = await (update?.(id, updates) ?? Promise.resolve({ ok: true as const, task: { ...existing, ...updates } }))
    if (result.ok) setTasks((prev) => prev.map((t) => (t.id === id ? result.task : t)))
    return result
  }
  return <ParentScreen tasks={tasks} deleteTask={() => {}} addTask={addTask} updateTask={updateTask} error={null} />
}

const created = (text: string): SaveResult => ({ ok: true, task: { id: 'new-1', text, done: false, subtasks: [] } })

async function fillAndSubmit(name: string, button = /create task/i) {
  await userEvent.click(screen.getByRole('button', { name: /\+ add task/i }))
  await userEvent.type(screen.getByLabelText(/^task name/i), name)
  await userEvent.click(screen.getByRole('button', { name: button }))
}

describe('creating a task', () => {
  it('goes back to the list, shows a toast, and highlights the new task', async () => {
    renderWithContext(<Harness add={async (t) => created(t.text)} />)
    await fillAndSubmit('Brush teeth')

    expect(await screen.findByText(/today's tasks/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('✓ "Brush teeth" added')
    const item = screen.getByRole('heading', { name: 'Brush teeth' }).closest('li')
    expect(item).toHaveAttribute('data-highlighted')
    expect(screen.getByRole('heading', { name: 'Make bed' }).closest('li')).not.toHaveAttribute('data-highlighted')
  })

  it('shows "Saving…" and disables the button while the save is running', async () => {
    let finish: (r: SaveResult) => void = () => {}
    renderWithContext(<Harness add={() => new Promise<SaveResult>((resolve) => { finish = resolve })} />)
    await fillAndSubmit('Brush teeth')

    const button = screen.getByRole('button', { name: /saving/i })
    expect(button).toBeDisabled()
    await act(async () => finish(created('Brush teeth')))
    expect(await screen.findByText(/today's tasks/i)).toBeInTheDocument()
  })

  it('creates only one task on a double click', async () => {
    const add = vi.fn(async (t: NewTask) => created(t.text))
    renderWithContext(<Harness add={add} />)
    await userEvent.click(screen.getByRole('button', { name: /\+ add task/i }))
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    await userEvent.dblClick(screen.getByRole('button', { name: /create task/i }))

    await screen.findByText(/today's tasks/i)
    expect(add).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('heading', { name: 'Brush teeth' })).toHaveLength(1)
  })

  it('ignores a second submit in the same tick, before the button can re-render as disabled', async () => {
    const add = vi.fn(async (t: NewTask) => created(t.text))
    renderWithContext(<Harness add={add} />)
    await userEvent.click(screen.getByRole('button', { name: /\+ add task/i }))
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    const form = screen.getByRole('button', { name: /create task/i }).closest('form') as HTMLFormElement
    await act(async () => {
      fireEvent.submit(form)
      fireEvent.submit(form)
    })
    await screen.findByText(/today's tasks/i)
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('stays on the form, keeps every value and shows the error by the button when saving fails', async () => {
    const add = vi.fn(async (): Promise<SaveResult> => ({ ok: false, error: 'Failed to add task. Please try again.' }))
    renderWithContext(<Harness add={add} />)
    await userEvent.click(screen.getByRole('button', { name: /\+ add task/i }))
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    await userEvent.type(screen.getByLabelText(/^hint/i), 'Two minutes')
    await userEvent.type(screen.getByLabelText(/^subtask name/i), 'Find the brush')
    await userEvent.click(screen.getByRole('button', { name: /add subtask/i }))
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to add task. Please try again.')
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Brush teeth')
    expect(screen.getByLabelText(/^hint/i)).toHaveValue('Two minutes')
    expect(screen.getByDisplayValue('Find the brush')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create task/i })).toBeEnabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    // Trying again works.
    add.mockResolvedValueOnce(created('Brush teeth'))
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(await screen.findByText(/today's tasks/i)).toBeInTheDocument()
  })

  it('treats a thrown error like a failed save', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderWithContext(<Harness add={async () => { throw new Error('network') }} />)
    await fillAndSubmit('Brush teeth')
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't save/i)
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Brush teeth')
  })
})

async function openEditForm(taskName: string) {
  await userEvent.click(screen.getByRole('button', { name: `Actions for ${taskName}` }))
  await userEvent.click(screen.getByRole('menuitem', { name: /edit task/i }))
}

describe('editing a task', () => {
  it('goes back to the list with a "Changes saved" toast', async () => {
    renderWithContext(<Harness add={async (t) => created(t.text)} />, { activeTaskId: '1' })
    await openEditForm('Make bed')
    await userEvent.type(screen.getByLabelText(/^task name/i), ' now')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/today's tasks/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('✓ Changes saved')
    expect(screen.getByRole('heading', { name: 'Make bed now' })).toBeInTheDocument()
  })

  it('stays on the form with the error when the update fails', async () => {
    const update = async (): Promise<SaveResult> => ({ ok: false, error: 'Failed to update task. Please try again.' })
    renderWithContext(<Harness add={async (t) => created(t.text)} update={update} />, { activeTaskId: '1' })
    await openEditForm('Make bed')
    await userEvent.type(screen.getByLabelText(/^task name/i), ' now')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update task')
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Make bed now')
  })
})

describe('Toast', () => {
  afterEach(() => vi.useRealTimers())

  it('is a polite live region that is present even when empty', () => {
    render(<Toast message={null} onDismiss={() => {}} />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
  })

  it('can be dismissed with its button', async () => {
    const onDismiss = vi.fn()
    render(<Toast message="✓ Changes saved" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss notification/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses itself after about 3 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast message="✓ Changes saved" onDismiss={onDismiss} />)
    act(() => { vi.advanceTimersByTime(2900) })
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(200) })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('goes away from the list screen once dismissed', async () => {
    renderWithContext(<Harness add={async (t) => created(t.text)} />)
    await fillAndSubmit('Brush teeth')
    await userEvent.click(await screen.findByRole('button', { name: /dismiss notification/i }))
    await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement())
  })
})
