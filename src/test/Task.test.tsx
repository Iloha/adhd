import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Task from '../components/Task'

const baseTask = { id: '1', text: 'Clean room', done: false }

describe('Task', () => {
  it('slides in only for people who have not asked for reduced motion, and only while it has just moved', () => {
    const { rerender } = render(<Task task={baseTask} onEdit={() => {}} />)
    const card = screen.getByRole('listitem')
    expect(card).not.toHaveAttribute('data-moved')
    expect(card.className).not.toMatch(/animate-settle/)
    rerender(<Task task={baseTask} onEdit={() => {}} moved />)
    expect(card).toHaveAttribute('data-moved')
    // Tailwind's motion-safe: variant switches the animation off under prefers-reduced-motion: reduce.
    expect(card.className).toContain('motion-safe:animate-settle')
    expect(card.className.split(/\s+/)).not.toContain('animate-settle')
  })

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

  describe('actions menu', () => {
    it('has an Edit action but no Delete action when onDelete is not given', async () => {
      render(<Task task={baseTask} onEdit={() => {}} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      expect(screen.getByRole('menuitem', { name: /edit task/i })).toBeInTheDocument()
      expect(screen.queryByRole('menuitem', { name: /delete task/i })).not.toBeInTheDocument()
    })

    it('shows Edit and Delete next to each other in the menu, with no separate edit button', async () => {
      render(<Task task={baseTask} onEdit={() => {}} onDelete={() => {}} />)
      expect(screen.queryByRole('button', { name: /^edit task$/i })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Edit task', 'Delete task'])
    })

    it('shows Edit, Archive and Delete in that order when all are available', async () => {
      render(<Task task={baseTask} onEdit={() => {}} onArchive={() => {}} onDelete={() => {}} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Edit task', 'Archive task', 'Delete task'])
    })

    describe('Do again', () => {
      const doneTask = { id: '7', text: 'Pack bag', done: true, subtasks: [{ title: 'Books', done: true }] }
      const openTask = { id: '8', text: 'Tidy desk', done: false, subtasks: [{ title: 'Papers', done: true }, { title: 'Pens', done: false }] }
      const menuFor = (name: string) => userEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }))

      it('is offered for a done task, after Edit', async () => {
        render(<Task task={doneTask} onEdit={() => {}} onDoAgain={() => {}} onDelete={() => {}} />)
        await menuFor('Pack bag')
        expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Edit task', 'Do again', 'Delete task'])
      })

      it('is also offered for a done task without steps', async () => {
        render(<Task task={{ id: '9', text: 'Plain', done: true }} onEdit={() => {}} onDoAgain={() => {}} />)
        await menuFor('Plain')
        expect(screen.getByRole('menuitem', { name: 'Do again' })).toBeInTheDocument()
      })

      it('is not offered for a task that is not done yet', async () => {
        render(<Task task={openTask} onEdit={() => {}} onDoAgain={() => {}} />)
        await menuFor('Tidy desk')
        expect(screen.queryByRole('menuitem', { name: /do again/i })).not.toBeInTheDocument()
      })

      it('is not offered when the screen does not support it', async () => {
        render(<Task task={doneTask} onEdit={() => {}} />)
        await menuFor('Pack bag')
        expect(screen.queryByRole('menuitem', { name: /do again/i })).not.toBeInTheDocument()
      })

      it('calls onDoAgain with the task id and closes the menu', async () => {
        const onDoAgain = vi.fn()
        render(<Task task={doneTask} onEdit={() => {}} onDoAgain={onDoAgain} />)
        await menuFor('Pack bag')
        await userEvent.click(screen.getByRole('menuitem', { name: 'Do again' }))
        expect(onDoAgain).toHaveBeenCalledWith('7')
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })

      it('does nothing and stays open while a copy is being saved', async () => {
        const onDoAgain = vi.fn()
        render(<Task task={doneTask} onEdit={() => {}} onDoAgain={onDoAgain} doAgainDisabled />)
        await menuFor('Pack bag')
        const item = screen.getByRole('menuitem', { name: 'Do again' })
        expect(item).toHaveAttribute('aria-disabled', 'true')
        await userEvent.click(item)
        expect(onDoAgain).not.toHaveBeenCalled()
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
    })

    it('has no Archive action unless onArchive is given', async () => {
      render(<Task task={baseTask} onEdit={() => {}} onDelete={() => {}} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      expect(screen.queryByRole('menuitem', { name: /archive task/i })).not.toBeInTheDocument()
    })

    it('calls onArchive with the task id and closes the menu', async () => {
      const onArchive = vi.fn()
      const onDelete = vi.fn()
      render(<Task task={baseTask} onEdit={() => {}} onArchive={onArchive} onDelete={onDelete} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      await userEvent.click(screen.getByRole('menuitem', { name: /archive task/i }))
      expect(onArchive).toHaveBeenCalledWith('1')
      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('calls onEdit with the task id and closes the menu', async () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(<Task task={baseTask} onEdit={onEdit} onDelete={onDelete} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      expect(screen.getByRole('menuitem', { name: /edit task/i })).toHaveFocus()
      await userEvent.click(screen.getByRole('menuitem', { name: /edit task/i }))
      expect(onEdit).toHaveBeenCalledWith('1')
      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('moves between the actions with the arrow keys', async () => {
      render(<Task task={baseTask} onEdit={() => {}} onDelete={() => {}} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      await userEvent.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /delete task/i })).toHaveFocus()
      await userEvent.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /edit task/i })).toHaveFocus()
      await userEvent.keyboard('{ArrowUp}')
      expect(screen.getByRole('menuitem', { name: /delete task/i })).toHaveFocus()
    })

    it('opens a menu with Edit and Delete actions and closes it again', async () => {
      render(<Task task={baseTask} onEdit={() => {}} onDelete={() => {}} />)
      const trigger = screen.getByRole('button', { name: 'Actions for Clean room' })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      await userEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menuitem', { name: /edit task/i })).toHaveFocus()
      expect(screen.getByRole('menuitem', { name: /delete task/i })).toBeInTheDocument()

      await userEvent.click(trigger)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('calls onDelete with the task id and closes the menu', async () => {
      const onDelete = vi.fn()
      render(<Task task={baseTask} onEdit={() => {}} onDelete={onDelete} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      await userEvent.click(screen.getByRole('menuitem', { name: /delete task/i }))
      expect(onDelete).toHaveBeenCalledWith('1')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('closes on Escape and gives focus back to the menu button', async () => {
      const onDelete = vi.fn()
      render(<Task task={baseTask} onEdit={() => {}} onDelete={onDelete} />)
      const trigger = screen.getByRole('button', { name: 'Actions for Clean room' })
      await userEvent.click(trigger)
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(trigger).toHaveFocus()
      expect(onDelete).not.toHaveBeenCalled()
    })

    it('closes when you click somewhere else, without deleting', async () => {
      const onDelete = vi.fn()
      render(<div><p>elsewhere</p><Task task={baseTask} onEdit={() => {}} onDelete={onDelete} /></div>)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Clean room' }))
      await userEvent.click(screen.getByText('elsewhere'))
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(onDelete).not.toHaveBeenCalled()
    })

    it('does nothing when the card is double-clicked', async () => {
      const onDelete = vi.fn()
      const onEdit = vi.fn()
      render(<Task task={baseTask} onEdit={onEdit} onDelete={onDelete} />)
      await userEvent.dblClick(screen.getByRole('heading', { name: 'Clean room' }))
      expect(onDelete).not.toHaveBeenCalled()
      expect(onEdit).not.toHaveBeenCalled()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })
})
