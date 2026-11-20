import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Tasks from '../components/Tasks'

const tasks = [
  { id: '1', text: 'Brush teeth', done: false },
  { id: '2', text: 'Make bed', done: true, subtasks: [{ title: 'Fluff pillow', done: true }] },
]

describe('Tasks', () => {
  it('renders all tasks', () => {
    render(<Tasks tasks={tasks} onEdit={() => {}} />)
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
    expect(screen.getByText('Make bed')).toBeInTheDocument()
  })

  it('renders correct number of list items', () => {
    render(<Tasks tasks={tasks} onEdit={() => {}} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders nothing when tasks list is empty', () => {
    render(<Tasks tasks={[]} onEdit={() => {}} />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('passes the delete action to every task', async () => {
    const onDelete = vi.fn()
    render(<Tasks tasks={tasks} onEdit={() => {}} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Make bed' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /delete task/i }))
    expect(onDelete).toHaveBeenCalledWith('2')
    expect(screen.getAllByRole('button', { name: /^actions for/i })).toHaveLength(2)
  })

  describe('reordering', () => {
    const three = [
      { id: 'a', text: 'First', done: false },
      { id: 'b', text: 'Second', done: false },
      { id: 'c', text: 'Third', done: false },
    ]

    it('shows no drag handles without onReorder', () => {
      render(<Tasks tasks={three} onEdit={() => {}} />)
      expect(screen.queryByRole('button', { name: /reorder/i })).not.toBeInTheDocument()
    })

    it('shows no drag handle for a single task', () => {
      render(<Tasks tasks={three.slice(0, 1)} onEdit={() => {}} onReorder={() => {}} />)
      expect(screen.queryByRole('button', { name: /reorder/i })).not.toBeInTheDocument()
    })

    it('gives every task a labelled drag handle', () => {
      render(<Tasks tasks={three} onEdit={() => {}} onReorder={() => {}} />)
      expect(screen.getByRole('button', { name: 'Reorder First' })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /^reorder/i })).toHaveLength(3)
    })

    // jsdom has no layout: give each list item its own row so keyboard moves have somewhere to go.
    function stackListItems() {
      return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const index = this.tagName === 'LI' ? Array.from(this.parentElement?.children ?? []).indexOf(this) : 0
        const top = index * 100
        return { x: 0, y: top, top, left: 0, right: 300, bottom: top + 90, width: 300, height: 90, toJSON: () => ({}) }
      })
    }

    // dnd-kit starts listening for the following keys on a timeout, so each key gets a tick.
    async function pressKeys(target: HTMLElement, codes: string[]) {
      for (const code of codes) {
        fireEvent.keyDown(target, { code, key: code === 'Space' ? ' ' : code })
        await act(() => new Promise((r) => setTimeout(r, 20)))
      }
    }

    it('moves a task with the keyboard and reports the new order', async () => {
      const rect = stackListItems()
      const onReorder = vi.fn()
      render(<Tasks tasks={three} onEdit={() => {}} onReorder={onReorder} />)
      const handle = screen.getByRole('button', { name: 'Reorder First' })
      handle.focus()
      await pressKeys(handle, ['Space', 'ArrowDown', 'Space'])
      await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1))
      expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
      rect.mockRestore()
    })

    it('reorders tasks whose ids are numbers (a bigint id column)', async () => {
      const rect = stackListItems()
      const onReorder = vi.fn()
      // Supabase returns bigint ids as JSON numbers, although the Task type says string.
      const numeric = [1, 2, 3].map((id) => ({ id: id as unknown as string, text: `Item ${id}`, done: false }))
      render(<Tasks tasks={numeric} onEdit={() => {}} onReorder={onReorder} />)
      const handle = screen.getByRole('button', { name: 'Reorder Item 1' })
      handle.focus()
      await pressKeys(handle, ['Space', 'ArrowDown', 'Space'])
      await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1))
      expect(onReorder).toHaveBeenCalledWith([2, 1, 3])
      rect.mockRestore()
    })

    it('does not report anything when the drag is cancelled with Escape', async () => {
      const rect = stackListItems()
      const onReorder = vi.fn()
      render(<Tasks tasks={three} onEdit={() => {}} onReorder={onReorder} />)
      const handle = screen.getByRole('button', { name: 'Reorder First' })
      handle.focus()
      await pressKeys(handle, ['Space', 'ArrowDown', 'Escape'])
      expect(onReorder).not.toHaveBeenCalled()
      rect.mockRestore()
    })
  })
})
