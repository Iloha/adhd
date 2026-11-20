import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
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

// The Done section remembers open/closed in localStorage; start every test closed.
beforeEach(() => window.localStorage.clear())

const openDone = () => userEvent.click(screen.getByRole('button', { name: /^done \(/i }))

describe('ParentScreen', () => {
  it('renders task count and completed count', () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    expect(screen.getByText('2 tasks • 1 completed')).toBeInTheDocument()
  })

  it('renders all tasks (done ones once the Done section is open)', async () => {
    renderWithContext(
      <ParentScreen tasks={tasks} deleteTask={() => {}} markDone={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
    )
    await openDone()
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
    expect(screen.getByText('Make bed')).toBeInTheDocument()
  })

  it('shows reorder handles when the screen can reorder tasks, and none otherwise', () => {
    const tasks = [
      { id: '1', text: 'Brush teeth', done: false, subtasks: [] },
      { id: '2', text: 'Make bed', done: false, subtasks: [] },
    ]
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

  describe('grouping done tasks', () => {
    const mixed = [
      { id: '1', text: 'Done early', done: true, subtasks: [], created_at: '2026-01-01T10:00:00Z' },
      { id: '2', text: 'First open', done: false, subtasks: [] },
      { id: '3', text: 'Done late', subtasks: [{ title: 's', done: true }], created_at: '2026-02-01T10:00:00Z' },
      { id: '4', text: 'Second open', subtasks: [{ title: 's', done: true }, { title: 't', done: false }] },
    ]
    const order = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

    it('lists unfinished tasks first, then a Done section with done tasks newest first', async () => {
      renderWithContext(<ParentScreen tasks={mixed} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />)
      expect(order()).toEqual(['First open', 'Second open', 'Done (2)'])
      await openDone()
      expect(order()).toEqual(['First open', 'Second open', 'Done (2)', 'Done late', 'Done early'])
    })

    it('has no Done section when nothing is done', () => {
      renderWithContext(<ParentScreen tasks={mixed.filter((t) => t.id === '2' || t.id === '4')} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />)
      expect(screen.queryByRole('heading', { name: /^done/i })).not.toBeInTheDocument()
    })

    it('counts all tasks in the header, and as completed exactly the ones in the Done section', () => {
      renderWithContext(<ParentScreen tasks={mixed} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />)
      expect(screen.getByText('4 tasks • 2 completed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Done (2)' })).toBeInTheDocument()
    })

    it('does not count a task as completed while it still has an open step', () => {
      const reopened = [{ id: '1', text: 'Reopened', done: true, subtasks: [{ title: 'a', done: true }, { title: 'b', done: false }] }]
      renderWithContext(<ParentScreen tasks={reopened} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />)
      expect(screen.getByText('1 tasks • 0 completed')).toBeInTheDocument()
    })

    it('offers drag handles for unfinished tasks only', () => {
      renderWithContext(<ParentScreen tasks={mixed} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} reorderTasks={() => {}} error={null} />)
      expect(screen.getByRole('button', { name: 'Reorder First open' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reorder Done late' })).not.toBeInTheDocument()
    })

    it('saves a new order for the unfinished tasks with the done tasks still included, at the end', async () => {
      // jsdom has no layout: give each list item its own row so keyboard moves have somewhere to go.
      const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const index = this.tagName === 'LI' ? Array.from(this.parentElement?.children ?? []).indexOf(this) : 0
        const top = index * 100
        return { x: 0, y: top, top, left: 0, right: 300, bottom: top + 90, width: 300, height: 90, toJSON: () => ({}) }
      })
      const reorderTasks = vi.fn()
      renderWithContext(<ParentScreen tasks={mixed} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} reorderTasks={reorderTasks} error={null} />)
      const handle = screen.getByRole('button', { name: 'Reorder First open' })
      handle.focus()
      // dnd-kit starts listening for the following keys on a timeout, so each key gets a tick.
      for (const code of ['Space', 'ArrowDown', 'Space']) {
        fireEvent.keyDown(handle, { code, key: code === 'Space' ? ' ' : code })
        await act(() => new Promise((r) => setTimeout(r, 20)))
      }
      await waitFor(() => expect(reorderTasks).toHaveBeenCalledTimes(1))
      expect(reorderTasks).toHaveBeenCalledWith(['4', '2', '1', '3'])
      rect.mockRestore()
    })
  })

  describe('doing a done task again', () => {
    const list = [
      { id: '1', text: 'Pack bag', done: true, subtasks: [{ title: 'Books', done: true }] },
      { id: '2', text: 'Tidy desk', done: false, subtasks: [] },
      { id: '3', text: 'Water plants', done: true, subtasks: [] },
    ]
    type Copy = (id: string) => Promise<{ ok: true; task: (typeof list)[number] } | { ok: false; error: string }>

    // Like the provider, a successful copy adds an unfinished task to the list.
    function Harness({ copy }: { copy: Copy }) {
      const [current, setCurrent] = useState(list)
      const duplicateTask: Copy = async (id) => {
        const result = await copy(id)
        if (result.ok) setCurrent((c) => [...c, result.task])
        return result
      }
      return <ParentScreen tasks={current} deleteTask={() => {}} duplicateTask={duplicateTask} addTask={() => {}} updateTask={() => {}} error={null} />
    }
    const newCopy = (id: string) => ({ id, text: 'Pack bag', done: false, subtasks: [{ title: 'Books', done: false }] })
    const succeed = () => vi.fn<Copy>(async () => ({ ok: true, task: newCopy('9') }))
    const menuItem = async (name: string) => {
      await userEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }))
      return screen.getByRole('menuitem', { name: 'Do again' })
    }

    it('offers "Do again" on done tasks only', async () => {
      renderWithContext(<Harness copy={succeed()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Tidy desk' }))
      expect(screen.queryByRole('menuitem', { name: 'Do again' })).not.toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      await openDone()
      expect(await menuItem('Pack bag')).toBeInTheDocument()
    })

    it('copies the task, stays on the list and confirms with a toast', async () => {
      const copy = succeed()
      renderWithContext(<Harness copy={copy} />)
      await openDone()
      await userEvent.click(await menuItem('Pack bag'))
      expect(copy).toHaveBeenCalledWith('1')
      expect(await screen.findByRole('status')).toHaveTextContent('✓ "Pack bag" added again')
      expect(screen.getByRole('heading', { name: /today's tasks/i })).toBeInTheDocument()
      // The original stays done; the copy is a new unfinished task.
      expect(screen.getAllByRole('heading', { name: 'Pack bag' })).toHaveLength(2)
      expect(screen.getByText('4 tasks • 2 completed')).toBeInTheDocument()
    })

    it('highlights the new task, and scrolls to it, like after creating a task', async () => {
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      renderWithContext(<Harness copy={succeed()} />)
      await openDone()
      await userEvent.click(await menuItem('Pack bag'))
      await waitFor(() => expect(document.querySelectorAll('[data-highlighted]')).toHaveLength(1))
      const highlighted = document.querySelector('[data-highlighted]')!
      // The copy sits in the unfinished list, not in the Done section.
      expect(highlighted.querySelector('h3')).toHaveTextContent('Pack bag')
      expect(screen.getByRole('button', { name: 'Done (2)' }).closest('section')).not.toContainElement(highlighted as HTMLElement)
      expect(scrollIntoView).toHaveBeenCalled()
      await waitFor(() => expect(document.querySelector('[data-highlighted]')).toBeNull(), { timeout: 3000 })
    })

    it('makes only one copy when the item is double-clicked', async () => {
      const copy = succeed()
      renderWithContext(<Harness copy={copy} />)
      await openDone()
      await userEvent.dblClick(await menuItem('Pack bag'))
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('added again'))
      expect(copy).toHaveBeenCalledTimes(1)
      expect(screen.getAllByRole('heading', { name: 'Pack bag' })).toHaveLength(2)
    })

    it('disables "Do again" on every task while a copy is being saved, then enables it again', async () => {
      let finish: () => void = () => {}
      const copy = vi.fn<Copy>(() => new Promise((resolve) => { finish = () => resolve({ ok: true, task: newCopy('9') }) }))
      renderWithContext(<Harness copy={copy} />)
      await openDone()
      await userEvent.click(await menuItem('Pack bag'))
      const other = await menuItem('Water plants')
      expect(other).toHaveAttribute('aria-disabled', 'true')
      await userEvent.click(other)
      expect(copy).toHaveBeenCalledTimes(1)
      await act(async () => finish())
      await userEvent.keyboard('{Escape}')
      expect(await menuItem('Water plants')).not.toHaveAttribute('aria-disabled')
    })

    it('shows no toast and no highlight when copying fails, and allows another try', async () => {
      const copy = vi.fn<Copy>(async () => ({ ok: false, error: 'Failed to copy task. Please try again.' }))
      renderWithContext(<Harness copy={copy} />)
      await openDone()
      await userEvent.click(await menuItem('Pack bag'))
      await waitFor(() => expect(copy).toHaveBeenCalledTimes(1))
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
      expect(document.querySelector('[data-highlighted]')).toBeNull()
      expect(screen.getAllByRole('heading', { name: 'Pack bag' })).toHaveLength(1)
      await userEvent.click(await menuItem('Pack bag'))
      expect(copy).toHaveBeenCalledTimes(2)
    })

    it('does not offer "Do again" when the screen cannot copy', async () => {
      renderWithContext(<ParentScreen tasks={list} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />)
      await openDone()
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Pack bag' }))
      expect(screen.queryByRole('menuitem', { name: 'Do again' })).not.toBeInTheDocument()
    })
  })

  describe('moving between groups', () => {
    const initial = [
      { id: 1, text: 'First open', done: false, subtasks: [] },
      { id: 2, text: 'Second open', done: false, subtasks: [] },
      { id: 3, text: 'Already done', done: true, subtasks: [] },
    ] as unknown as typeof tasks // numeric ids, as a bigint id column gives

    // Stands in for the provider: the buttons change a task like a save would, then the list re-renders.
    function Harness() {
      const [list, setList] = useState(initial)
      const set = (id: number, done: boolean) => setList((current) => current.map((t) => (Number(t.id) === id ? { ...t, done } : t)))
      return (
        <>
          <button onClick={() => set(1, true)}>finish first</button>
          <button onClick={() => set(3, false)}>reopen done</button>
          <button onClick={() => setList((current) => [...current, { id: 9, text: 'Brand new', done: false, subtasks: [] } as never])}>add task</button>
          <ParentScreen tasks={list} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
        </>
      )
    }
    const names = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    const card = (name: string) => screen.getByRole('heading', { name }).closest('li')

    it('does not animate anything on the first render', async () => {
      renderWithContext(<Harness />)
      await openDone()
      expect(document.querySelector('[data-moved]')).toBeNull()
    })

    it('moves a task into the Done section when it is finished, and updates the header', async () => {
      renderWithContext(<Harness />)
      await openDone()
      expect(names()).toEqual(['First open', 'Second open', 'Done (1)', 'Already done'])
      expect(screen.getByText('3 tasks • 1 completed')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'finish first' }))
      expect(names()).toEqual(['Second open', 'Done (2)', 'First open', 'Already done'])
      expect(screen.getByText('3 tasks • 2 completed')).toBeInTheDocument()
      expect(card('First open')).toHaveAttribute('data-moved')
      expect(card('Already done')).not.toHaveAttribute('data-moved')
    })

    it('moves a task back to the unfinished group when it is no longer done', async () => {
      renderWithContext(<Harness />)
      await userEvent.click(screen.getByRole('button', { name: 'reopen done' }))
      expect(names()).toEqual(['First open', 'Second open', 'Already done'])
      expect(screen.queryByRole('button', { name: /^done \(/i })).not.toBeInTheDocument()
      expect(screen.getByText('3 tasks • 0 completed')).toBeInTheDocument()
      expect(card('Already done')).toHaveAttribute('data-moved')
    })

    it('stops the animation after a moment', async () => {
      renderWithContext(<Harness />)
      await userEvent.click(screen.getByRole('button', { name: 'reopen done' }))
      expect(card('Already done')).toHaveAttribute('data-moved')
      await waitFor(() => expect(card('Already done')).not.toHaveAttribute('data-moved'), { timeout: 2000 })
    })

    it('does not animate a task that was only added', async () => {
      renderWithContext(<Harness />)
      await userEvent.click(screen.getByRole('button', { name: 'add task' }))
      expect(screen.getByText('Brand new')).toBeInTheDocument()
      expect(document.querySelector('[data-moved]')).toBeNull()
    })
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
      const { user, remove, deleteTask } = setup()
      await user.click(screen.getByRole('button', { name: /^done \(/i }))
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
      const { user, remove, deleteTask } = setup()
      await user.click(screen.getByRole('button', { name: /^done \(/i }))
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

  describe('archiving a task', () => {
    const withArchived = [...tasks, { id: '3', text: 'Old homework', done: false, subtasks: [], archived: true }]

    it('keeps archived tasks out of the list and counts, and offers them in an Archived dropdown', async () => {
      renderWithContext(
        <ParentScreen tasks={withArchived} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
      )
      expect(screen.queryByText('Old homework')).not.toBeInTheDocument()
      expect(screen.getByText('2 tasks • 1 completed')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /archived \(1\)/i }))
      expect(screen.getByText('Old homework')).toBeInTheDocument()
    })

    it('shows the Archived dropdown below the task list', () => {
      renderWithContext(
        <ParentScreen tasks={withArchived} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
      )
      const lastTask = screen.getByRole('button', { name: /^done \(1\)/i })
      const dropdown = screen.getByRole('button', { name: /archived \(1\)/i })
      expect(lastTask.compareDocumentPosition(dropdown) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('has no Archived dropdown when nothing is archived', () => {
      renderWithContext(
        <ParentScreen tasks={tasks} deleteTask={() => {}} addTask={() => {}} updateTask={() => {}} error={null} />
      )
      expect(screen.queryByRole('button', { name: /archived/i })).not.toBeInTheDocument()
    })

    it('archives from the task menu: saves archived: true and confirms with a toast', async () => {
      const updateTask = vi.fn().mockResolvedValue({ ok: true, task: tasks[0] })
      renderWithContext(
        <ParentScreen tasks={tasks} deleteTask={() => {}} addTask={() => {}} updateTask={updateTask} error={null} />
      )
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Brush teeth' }))
      await userEvent.click(screen.getByRole('menuitem', { name: /archive task/i }))
      expect(updateTask).toHaveBeenCalledWith('1', { archived: true })
      expect(await screen.findByRole('status')).toHaveTextContent('Task archived')
    })

    it('shows no success toast when archiving fails', async () => {
      const updateTask = vi.fn().mockResolvedValue({ ok: false, error: 'Failed to update task. Please try again.' })
      renderWithContext(
        <ParentScreen tasks={tasks} deleteTask={() => {}} addTask={() => {}} updateTask={updateTask} error={null} />
      )
      await userEvent.click(screen.getByRole('button', { name: 'Actions for Brush teeth' }))
      await userEvent.click(screen.getByRole('menuitem', { name: /archive task/i }))
      expect(updateTask).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it('restores from the dropdown: saves archived: false and confirms with a toast', async () => {
      const updateTask = vi.fn().mockResolvedValue({ ok: true, task: withArchived[2] })
      renderWithContext(
        <ParentScreen tasks={withArchived} deleteTask={() => {}} addTask={() => {}} updateTask={updateTask} error={null} />
      )
      await userEvent.click(screen.getByRole('button', { name: /archived \(1\)/i }))
      await userEvent.click(screen.getByRole('button', { name: 'Restore Old homework' }))
      expect(updateTask).toHaveBeenCalledWith('3', { archived: false })
      expect(await screen.findByRole('status')).toHaveTextContent('Task restored')
    })
  })
})
