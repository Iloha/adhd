import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Tasks from '../components/Tasks'

const tasks = [
  { id: '1', text: 'Brush teeth', done: false },
  { id: '2', text: 'Make bed', done: true, subtasks: [{ title: 'Fluff pillow', done: true }] },
]

describe('Tasks', () => {
  it('renders all tasks', () => {
    render(<Tasks tasks={tasks} />)
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
    expect(screen.getByText('Make bed')).toBeInTheDocument()
  })

  it('renders correct number of list items', () => {
    render(<Tasks tasks={tasks} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders nothing when tasks list is empty', () => {
    render(<Tasks tasks={[]} />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
