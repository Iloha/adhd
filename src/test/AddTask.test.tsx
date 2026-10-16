import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, expect, vi } from 'vitest'
import AddTask from '../components/AddTask'
import { renderWithContext } from './helpers'

const existing = {
  id: '7',
  text: 'Clean room',
  hint: 'Start with the floor',
  done: false,
  subtasks: [{ title: 'Pick up toys', hint: 'Under the bed', done: false }],
}

describe('AddTask', () => {
  it('submits a new task with name and hint', async () => {
    const onAdd = vi.fn()
    renderWithContext(
      <AddTask onAdd={onAdd} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    await userEvent.type(screen.getByLabelText(/^hint/i), 'Two minutes')
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(onAdd).toHaveBeenCalledWith({ text: 'Brush teeth', hint: 'Two minutes', subtasks: [] })
  })

  it('adds a subtask with its hint and clears the subtask inputs', async () => {
    const onAdd = vi.fn()
    renderWithContext(
      <AddTask onAdd={onAdd} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Clean room')
    await userEvent.type(screen.getByLabelText(/subtask name/i), 'Pick up toys')
    await userEvent.type(screen.getByLabelText(/subtask hint/i), 'Under the bed')
    await userEvent.click(screen.getByRole('button', { name: /add subtask/i }))
    expect(screen.getByLabelText(/subtask name/i)).toHaveValue('')
    expect(screen.getByLabelText(/subtask hint/i)).toHaveValue('')

    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(onAdd).toHaveBeenCalledWith({
      text: 'Clean room',
      hint: '',
      subtasks: [{ title: 'Pick up toys', hint: 'Under the bed', done: false }],
    })
  })

  it('resets the form after creating a task', async () => {
    renderWithContext(
      <AddTask onAdd={() => {}} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('')
  })

  it('pre-fills the form from the active task in edit mode', () => {
    renderWithContext(
      <AddTask onAdd={() => {}} onUpdate={() => {}} mode="edit" tasks={[existing]} setScreen={() => {}} />,
      { activeTaskId: '7' }
    )
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Clean room')
    expect(screen.getByLabelText(/^hint/i)).toHaveValue('Start with the floor')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('updates the task and returns to the list in edit mode', async () => {
    const onUpdate = vi.fn()
    const setScreen = vi.fn()
    renderWithContext(
      <AddTask onAdd={() => {}} onUpdate={onUpdate} mode="edit" tasks={[existing]} setScreen={setScreen} />,
      { activeTaskId: '7' }
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), ' now')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(onUpdate).toHaveBeenCalledWith('7', {
      text: 'Clean room now',
      hint: 'Start with the floor',
      subtasks: existing.subtasks,
    })
    expect(setScreen).toHaveBeenCalledWith('tasks')
  })
})

const suggested = [
  { title: 'Pick up trash', hint: 'Five items is enough', minutes: 2, emoji: '🗑️' },
  { title: 'Put clothes in the basket', hint: 'One big armful', minutes: 3, emoji: '🧺' },
  { title: 'Make your bed', hint: 'Just pull up the blanket', minutes: 2, emoji: '🛏️' },
  { title: 'Wipe your desk', hint: 'Quick swipe', minutes: 1, emoji: '🧽' },
]

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderForm(onAdd = vi.fn()) {
  renderWithContext(
    <AddTask onAdd={onAdd} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
  )
  return onAdd
}

async function suggest(name = 'Clean your room') {
  await userEvent.type(screen.getByLabelText(/^task name/i), name)
  await userEvent.click(screen.getByRole('button', { name: /suggest steps/i }))
}

afterEach(() => vi.unstubAllGlobals())

describe('AddTask - AI step suggestions', () => {
  it('disables "Suggest steps" until a task name is typed', async () => {
    renderForm()
    const button = screen.getByRole('button', { name: /suggest steps/i })
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/^task name/i), '   ')
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Clean')
    expect(button).toBeEnabled()
  })

  it('sends the task to the API and fills the steps', async () => {
    const fetchMock = mockFetch(200, { steps: suggested })
    renderForm()
    await suggest()
    expect(await screen.findByLabelText('Step 1 title')).toHaveValue('Pick up trash')
    expect(screen.getByLabelText('Step 2 title')).toHaveValue('Put clothes in the basket')
    expect(screen.getByLabelText('Step 3 hint')).toHaveValue('Just pull up the blanket')
    expect(screen.getByLabelText('Step 1 emoji')).toHaveValue('🗑️')
    expect(screen.getByLabelText('Step 4 minutes')).toHaveValue(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/breakdown', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ task: 'Clean your room' }),
    }))
  })

  it('shows a loading skeleton and disables the button while waiting', async () => {
    let resolve!: (value: unknown) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resolve = r })))
    renderForm()
    await suggest()
    expect(screen.getByRole('status')).toHaveTextContent(/thinking up steps/i)
    expect(screen.getByRole('button', { name: /thinking/i })).toBeDisabled()
    resolve({ ok: true, status: 200, json: async () => ({ steps: suggested }) })
    expect(await screen.findByLabelText('Step 1 title')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('lets the user edit, reorder and delete steps, then saves them', async () => {
    mockFetch(200, { steps: suggested })
    const onAdd = renderForm()
    await suggest()
    await screen.findByLabelText('Step 1 title')

    await userEvent.clear(screen.getByLabelText('Step 1 title'))
    await userEvent.type(screen.getByLabelText('Step 1 title'), 'Grab a trash bag')
    await userEvent.click(screen.getByRole('button', { name: 'Move step 2 up' }))
    expect(screen.getByLabelText('Step 1 title')).toHaveValue('Put clothes in the basket')
    await userEvent.click(screen.getByRole('button', { name: 'Delete step 4' }))
    expect(screen.queryByLabelText('Step 4 title')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(onAdd).toHaveBeenCalledWith({
      text: 'Clean your room',
      hint: '',
      subtasks: [
        { title: 'Put clothes in the basket', hint: 'One big armful', minutes: 3, emoji: '🧺', done: false },
        { title: 'Grab a trash bag', hint: 'Five items is enough', minutes: 2, emoji: '🗑️', done: false },
        { title: 'Make your bed', hint: 'Just pull up the blanket', minutes: 2, emoji: '🛏️', done: false },
      ],
    })
  })

  it('disables the move buttons at the ends of the list', async () => {
    mockFetch(200, { steps: suggested })
    renderForm()
    await suggest()
    await screen.findByLabelText('Step 1 title')
    expect(screen.getByRole('button', { name: 'Move step 1 up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move step 4 down' })).toBeDisabled()
  })

  it('still lets the user add a step by hand next to suggested ones', async () => {
    mockFetch(200, { steps: suggested })
    renderForm()
    await suggest()
    await screen.findByLabelText('Step 1 title')
    await userEvent.type(screen.getByLabelText(/subtask name/i), 'Vacuum')
    await userEvent.click(screen.getByRole('button', { name: /add subtask/i }))
    expect(screen.getByLabelText('Step 5 title')).toHaveValue('Vacuum')
  })

  it('"Regenerate" replaces the current steps', async () => {
    const fetchMock = mockFetch(200, { steps: suggested })
    renderForm()
    await suggest()
    await screen.findByLabelText('Step 1 title')
    await userEvent.type(screen.getByLabelText('Step 1 title'), ' edited')

    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ steps: suggested.map((s) => ({ ...s, title: `New ${s.title}` })) }),
    })
    await userEvent.click(screen.getByRole('button', { name: /regenerate/i }))
    await waitFor(() => expect(screen.getByLabelText('Step 1 title')).toHaveValue('New Pick up trash'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shows the rate-limit message on a 429', async () => {
    mockFetch(429, { error: 'Too many requests, try again in a minute' })
    renderForm()
    await suggest()
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests, try again in a minute')
    expect(screen.queryByLabelText('Step 1 title')).not.toBeInTheDocument()
  })

  it("shows the server's friendly message for a busy or refused request", async () => {
    mockFetch(503, { error: 'The step helper is busy right now. Please try again in a moment.' })
    renderForm()
    await suggest()
    expect(await screen.findByRole('alert')).toHaveTextContent(/busy right now/i)
  })

  it('shows a generic message for server errors', async () => {
    mockFetch(502, { error: 'internal detail' })
    renderForm()
    await suggest()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/couldn't suggest steps right now/i)
    expect(alert).not.toHaveTextContent('internal detail')
  })

  it('shows a generic message when the network fails, and the form still works', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const onAdd = renderForm()
    await suggest()
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't suggest steps right now/i)
    expect(screen.getByRole('button', { name: /suggest steps/i })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(onAdd).toHaveBeenCalled()
  })

  it('does not call the API for a task name over 100 characters', async () => {
    const fetchMock = mockFetch(200, { steps: suggested })
    renderForm()
    await suggest('a'.repeat(101))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await screen.findByRole('alert')).toHaveTextContent(/too long/i)
  })

  it('clears an earlier error when a new request succeeds', async () => {
    const fetchMock = mockFetch(502, {})
    renderForm()
    await suggest()
    await screen.findByRole('alert')
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ steps: suggested }) })
    await userEvent.click(screen.getByRole('button', { name: /suggest steps/i }))
    await screen.findByLabelText('Step 1 title')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
