import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ParentScreen from '../screens/ParentScreen'
import { renderWithContext } from './helpers'

vi.mock('../app/parent/actions', () => ({
  getPinStatus: vi.fn().mockResolvedValue(true),
  setPin: vi.fn(),
  startChildMode: vi.fn(),
}))
vi.mock('../app/auth/actions', () => ({ signOut: vi.fn() }))

const tasks = [
  { id: '1', text: 'Brush teeth', done: false, subtasks: [] },
  { id: '2', text: 'Make bed', done: true, subtasks: [] },
]

describe('ParentScreen', () => {
  it('renders task count and completed count', () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    expect(screen.getByText('2 tasks • 1 completed')).toBeInTheDocument()
  })

  it('renders all tasks', () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
    expect(screen.getByText('Make bed')).toBeInTheDocument()
  })

  it('displays an error message when error prop is set', () => {
    renderWithContext(
      <ParentScreen
        updateTask={() => {}}
        tasks={tasks}
        deleteTask={() => {}}
        markDone={() => {}}
        addTask={() => {}}
        error="Failed to add task. Please try again."
      />
    )
    expect(screen.getByText('Failed to add task. Please try again.')).toBeInTheDocument()
  })

  it('opens the start-child-mode screen when "Child Mode" is clicked', async () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    await userEvent.click(screen.getByRole('button', { name: /child mode/i }))
    expect(screen.getByRole('heading', { name: /start child mode/i })).toBeInTheDocument()
    expect(await screen.findByText(/who is using it/i)).toBeInTheDocument()
  })

  it('shows Add Task form when "+ Add Task" button clicked', async () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    await userEvent.click(screen.getByRole('button', { name: /\+ add task/i }))
    expect(screen.getByText('New task')).toBeInTheDocument()
  })

  it('opens an empty form from "+ Add Task" and goes back to the list', async () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    await userEvent.click(screen.getByRole('button', { name: /add task/i }))
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /back to tasks/i }))
    expect(screen.getByText(/today's tasks/i)).toBeInTheDocument()
  })

  it('opens the edit form pre-filled when a task\'s edit button is clicked', async () => {
    const setActiveTaskId = vi.fn()
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />,
      { activeTaskId: '1', setActiveTaskId }
    )
    await userEvent.click(screen.getAllByRole('button', { name: /edit task/i })[0])
    expect(setActiveTaskId).toHaveBeenCalledWith('1')
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Brush teeth')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
