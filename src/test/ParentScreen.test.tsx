import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { act } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
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

  it('shows reorder handles when the screen can reorder tasks, and none otherwise', () => {
    const { unmount } = renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} reorderTasks={() => {}} error={null} />
    )
    expect(screen.getByRole('button', { name: 'Reorder Brush teeth' })).toBeInTheDocument()
    unmount()
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    expect(screen.queryByRole('button', { name: /reorder/i })).not.toBeInTheDocument()
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

  it('opens the edit form pre-filled when Edit is chosen in a task\'s menu', async () => {
    const setActiveTaskId = vi.fn()
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />,
      { activeTaskId: '1', setActiveTaskId }
    )
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Brush teeth' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /edit task/i }))
    expect(setActiveTaskId).toHaveBeenCalledWith('1')
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Brush teeth')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  describe('deleting a task', () => {
    afterEach(() => vi.useRealTimers())

    // Like the real provider, a delete removes the task from the list it passes down.
    function Harness({ onDelete, markDone }: { onDelete: (id: string) => void | Promise<void>; markDone: () => void }) {
      const [list, setList] = useState(tasks)
      const deleteTask = async (id: string) => {
        await onDelete(id)
        setList((current) => current.filter((t) => t.id !== id))
      }
      return <ParentScreen tasks={list} deleteTask={deleteTask} markDone={markDone} addTask={() => {}} updateTask={() => {}} error={null} />
    }

    function setup(deleteTask: (id: string) => void | Promise<void> = vi.fn(), markDone = vi.fn()) {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const view = renderWithContext(<Harness onDelete={deleteTask} markDone={markDone} />)
      const remove = async (name: string) => {
        await user.click(screen.getByRole('button', { name: `Actions for ${name}` }))
        await user.click(screen.getByRole('menuitem', { name: /delete task/i }))
      }
      return { user, view, remove, deleteTask, markDone }
    }

    it('hides the task and shows "Task deleted" with Undo, but does not delete yet', async () => {
      const { remove, deleteTask } = setup()
      await remove('Brush teeth')
      expect(screen.queryByText('Brush teeth')).not.toBeInTheDocument()
      expect(screen.getByText('Make bed')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Task deleted')
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
      expect(screen.getByText('1 tasks • 1 completed')).toBeInTheDocument()
      expect(deleteTask).not.toHaveBeenCalled()
    })

    it('brings the task back on Undo and never deletes it', async () => {
      const { user, remove, deleteTask } = setup()
      await remove('Brush teeth')
      await user.click(screen.getByRole('button', { name: 'Undo' }))
      expect(screen.getByText('Brush teeth')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
      await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
      expect(deleteTask).not.toHaveBeenCalled()
    })

    it('deletes for real after 5 seconds, not before', async () => {
      const { remove, deleteTask } = setup()
      await remove('Brush teeth')
      await act(async () => { await vi.advanceTimersByTimeAsync(4900) })
      expect(deleteTask).not.toHaveBeenCalled()
      await act(async () => { await vi.advanceTimersByTimeAsync(200) })
      expect(deleteTask).toHaveBeenCalledTimes(1)
      expect(deleteTask).toHaveBeenCalledWith('1')
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    })

    it('deletes the first task right away when a second one is deleted', async () => {
      const { remove, deleteTask } = setup()
      await remove('Brush teeth')
      await remove('Make bed')
      expect(deleteTask).toHaveBeenCalledTimes(1)
      expect(deleteTask).toHaveBeenCalledWith('1')
      // Undo now only brings back the second task.
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Undo' }))
      expect(screen.getByText('Make bed')).toBeInTheDocument()
      expect(screen.queryByText('Brush teeth')).not.toBeInTheDocument()
    })

    it('deletes straight away when the toast is dismissed', async () => {
      const { user, remove, deleteTask } = setup()
      await remove('Brush teeth')
      await user.click(screen.getByRole('button', { name: /dismiss notification/i }))
      expect(deleteTask).toHaveBeenCalledWith('1')
    })

    it('still deletes if the screen goes away during the undo time', async () => {
      const { view, remove, deleteTask } = setup()
      await remove('Brush teeth')
      view.unmount()
      expect(deleteTask).toHaveBeenCalledWith('1')
    })

    it('keeps the task hidden until the delete has finished', async () => {
      let finish: () => void = () => {}
      const deleteTask = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
      const { remove } = setup(deleteTask)
      await remove('Brush teeth')
      await act(async () => { await vi.advanceTimersByTimeAsync(5100) })
      expect(deleteTask).toHaveBeenCalled()
      expect(screen.queryByText('Brush teeth')).not.toBeInTheDocument()
      await act(async () => finish())
      expect(screen.queryByText('Brush teeth')).not.toBeInTheDocument()
    })

    it('shows the task again if the delete fails and it is still in the list', async () => {
      const failing = vi.fn(() => Promise.reject(new Error('nope')))
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      // The real provider reports the error itself and keeps the task, so deleteTask resolves.
      renderWithContext(
        <ParentScreen tasks={tasks} deleteTask={() => failing().catch(() => {})} addTask={() => {}} updateTask={() => {}} error={null} />
      )
      await user.click(screen.getByRole('button', { name: 'Actions for Brush teeth' }))
      await user.click(screen.getByRole('menuitem', { name: /delete task/i }))
      await act(async () => { await vi.advanceTimersByTimeAsync(5100) })
      expect(screen.getByText('Brush teeth')).toBeInTheDocument()
    })

    it('does nothing when a task card is double-clicked (no hidden toggle)', async () => {
      const updateTask = vi.fn()
      const { user, deleteTask, markDone } = setup()
      await user.dblClick(screen.getByRole('heading', { name: 'Brush teeth' }))
      expect(markDone).not.toHaveBeenCalled()
      expect(deleteTask).not.toHaveBeenCalled()
      expect(updateTask).not.toHaveBeenCalled()
      expect(screen.getByText('2 tasks • 1 completed')).toBeInTheDocument()
    })
  })
})
