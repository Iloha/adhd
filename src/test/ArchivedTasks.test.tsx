import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ArchivedTasks from '../components/ArchivedTasks'

const archived = [
  { id: '1', text: 'Old homework', done: false, archived: true },
  { id: '2', text: 'Water plants', done: true, archived: true },
]

describe('ArchivedTasks', () => {
  it('renders nothing when there are no archived tasks', () => {
    const { container } = render(<ArchivedTasks tasks={[]} onRestore={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is a closed dropdown that shows how many tasks are archived', () => {
    render(<ArchivedTasks tasks={archived} onRestore={() => {}} />)
    const toggle = screen.getByRole('button', { name: /archived \(2\)/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Old homework')).not.toBeInTheDocument()
  })

  it('opens and closes to show the archived tasks', async () => {
    render(<ArchivedTasks tasks={archived} onRestore={() => {}} />)
    const toggle = screen.getByRole('button', { name: /archived \(2\)/i })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Old homework')).toBeInTheDocument()
    expect(screen.getByText('Water plants')).toBeInTheDocument()
    await userEvent.click(toggle)
    expect(screen.queryByText('Old homework')).not.toBeInTheDocument()
  })

  it('restores the task whose Restore button was pressed', async () => {
    const onRestore = vi.fn()
    render(<ArchivedTasks tasks={archived} onRestore={onRestore} />)
    await userEvent.click(screen.getByRole('button', { name: /archived/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Restore Water plants' }))
    expect(onRestore).toHaveBeenCalledTimes(1)
    expect(onRestore).toHaveBeenCalledWith('2')
  })
})
