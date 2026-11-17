import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Task from '../components/Task'

const baseTask = { id: '1', text: 'Clean room', done: false }

describe('Task', () => {
  it('renders the task text', () => {
    render(<Task task={baseTask} onEdit={() => {}} />)
    expect(screen.getByText('Clean room')).toBeInTheDocument()
  })

  it('shows 0 / 0 steps when no subtasks', () => {
    render(<Task task={baseTask} onEdit={() => {}} />)
    expect(screen.getByText('0 / 0 steps completed')).toBeInTheDocument()
  })

  it('shows correct step count with subtasks', () => {
    const task = {
      ...baseTask,
      subtasks: [
        { title: 'Step 1', done: true },
        { title: 'Step 2', done: false },
      ],
    }
    render(<Task task={task} onEdit={() => {}} />)
    expect(screen.getByText('1 / 2 steps completed')).toBeInTheDocument()
  })

  it('shows "In progress" badge when partially complete', () => {
    const task = {
      ...baseTask,
      subtasks: [
        { title: 'Step 1', done: true },
        { title: 'Step 2', done: false },
      ],
    }
    render(<Task task={task} onEdit={() => {}} />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('shows "Done" badge when all subtasks complete', () => {
    const task = {
      ...baseTask,
      subtasks: [
        { title: 'Step 1', done: true },
        { title: 'Step 2', done: true },
      ],
    }
    render(<Task task={task} onEdit={() => {}} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('renders a progress bar with correct aria-valuenow', () => {
    const task = {
      ...baseTask,
      subtasks: [
        { title: 'Step 1', done: true },
        { title: 'Step 2', done: true },
        { title: 'Step 3', done: false },
      ],
    }
    render(<Task task={task} onEdit={() => {}} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '67')
  })

  it('hands its node to the sortable list once, and does not detach it on re-render', () => {
    const setNodeRef = vi.fn()
    const sortable = () => ({ setNodeRef, style: {}, handleProps: {}, isDragging: false })
    const { rerender } = render(<Task task={baseTask} onEdit={() => {}} sortable={sortable()} />)
    // New props object each time, as dnd-kit gives one while dragging.
    rerender(<Task task={baseTask} onEdit={() => {}} sortable={{ ...sortable(), isDragging: true }} />)
    rerender(<Task task={baseTask} onEdit={() => {}} sortable={sortable()} />)
    expect(setNodeRef).toHaveBeenCalledTimes(1)
    expect(setNodeRef.mock.calls[0][0]).toBeInstanceOf(HTMLLIElement)
  })
})
