import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChildPage from '../app/child/page'
import ParentPage from '../app/parent/page'
import { renderWithContext } from './helpers'

const { useTasks } = vi.hoisted(() => ({ useTasks: vi.fn() }))
vi.mock('../context/TasksContext', () => ({ useTasks }))

const task = { id: '1', text: 'Brush teeth', done: false, subtasks: [] }

function state(overrides = {}) {
  return {
    tasks: [task],
    setTasks: vi.fn(),
    activeTask: task,
    loading: false,
    error: null,
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    markDone: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => useTasks.mockReset())

describe('ParentPage', () => {
  it('shows a loading state while tasks load', () => {
    useTasks.mockReturnValue(state({ loading: true }))
    renderWithContext(<ParentPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText(/today's tasks/i)).not.toBeInTheDocument()
  })

  it('renders the task list once loaded', () => {
    useTasks.mockReturnValue(state())
    renderWithContext(<ParentPage />)
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
  })

  it('shows an error from the tasks provider', () => {
    useTasks.mockReturnValue(state({ error: 'Failed to delete task. Please try again.' }))
    renderWithContext(<ParentPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(/failed to delete/i)
  })
})

describe('ChildPage', () => {
  it('shows a loading state while tasks load', () => {
    useTasks.mockReturnValue(state({ loading: true, activeTask: undefined }))
    renderWithContext(<ChildPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows a friendly message when there are no tasks', () => {
    useTasks.mockReturnValue(state({ tasks: [], activeTask: undefined }))
    renderWithContext(<ChildPage />)
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('shows the active task', () => {
    useTasks.mockReturnValue(state())
    renderWithContext(<ChildPage />)
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
  })

  it('shows an error from the tasks provider', () => {
    useTasks.mockReturnValue(state({ error: 'Failed to update task. Please try again.' }))
    renderWithContext(<ChildPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(/failed to update/i)
  })
})
