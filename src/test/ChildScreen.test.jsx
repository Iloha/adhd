import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ChildScreen from '../screens/ChildScreen'
import { renderWithContext } from './helpers'

const baseTask = { id: '1', text: 'Brush teeth', done: false, subtasks: [] }

const taskWithSubtasks = {
  id: '2',
  text: 'Clean room',
  done: false,
  subtasks: [
    { title: 'Pick up toys', hint: 'Check under the bed', done: false },
    { title: 'Make bed', hint: '', done: false },
  ],
}

describe('ChildScreen', () => {
  it('renders task text for a simple task', () => {
    renderWithContext(
      <ChildScreen
        tasks={[baseTask]}
        activeTask={baseTask}
        setTasks={() => {}}
        markDone={() => {}}
        updateTask={() => {}}
      />
    )
    expect(screen.getByText('Brush teeth')).toBeInTheDocument()
  })

  it('shows the first subtask title and hint', () => {
    renderWithContext(
      <ChildScreen
        tasks={[taskWithSubtasks]}
        activeTask={taskWithSubtasks}
        setTasks={() => {}}
        markDone={() => {}}
        updateTask={() => {}}
      />
    )
    expect(screen.getByText('Pick up toys')).toBeInTheDocument()
    expect(screen.getByText('Check under the bed')).toBeInTheDocument()
  })

  it('shows step progress counter', () => {
    renderWithContext(
      <ChildScreen
        tasks={[taskWithSubtasks]}
        activeTask={taskWithSubtasks}
        setTasks={() => {}}
        markDone={() => {}}
        updateTask={() => {}}
      />
    )
    expect(screen.getByText('1 / 2 steps')).toBeInTheDocument()
  })

  it('shows "Great job!" when task is done', () => {
    const doneTask = {
      id: '3',
      text: 'Exercise',
      done: true,
      subtasks: [{ title: 'Run', done: true }],
    }
    renderWithContext(
      <ChildScreen
        tasks={[doneTask]}
        activeTask={doneTask}
        setTasks={() => {}}
        markDone={() => {}}
        updateTask={() => {}}
      />
    )
    expect(screen.getByText('Great job!')).toBeInTheDocument()
  })

  it('calls updateTask with done:true when Complete clicked on simple task', async () => {
    const updateTask = vi.fn()
    const setTasks = vi.fn()
    renderWithContext(
      <ChildScreen
        tasks={[baseTask]}
        activeTask={baseTask}
        setTasks={setTasks}
        markDone={() => {}}
        updateTask={updateTask}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /complete/i }))
    expect(updateTask).toHaveBeenCalledWith('1', { done: true })
  })

  it('calls updateTask with updated subtasks when Complete clicked on subtask', async () => {
    const updateTask = vi.fn()
    const setTasks = vi.fn()
    renderWithContext(
      <ChildScreen
        tasks={[taskWithSubtasks]}
        activeTask={taskWithSubtasks}
        setTasks={setTasks}
        markDone={() => {}}
        updateTask={updateTask}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /complete/i }))
    expect(updateTask).toHaveBeenCalledWith('2', {
      subtasks: [
        { title: 'Pick up toys', hint: 'Check under the bed', done: true },
        { title: 'Make bed', hint: '', done: false },
      ],
    })
  })

  it('switches to parent mode on Shift+P', () => {
    const setMode = vi.fn()
    renderWithContext(
      <ChildScreen
        tasks={[baseTask]}
        activeTask={baseTask}
        setTasks={() => {}}
        markDone={() => {}}
        updateTask={() => {}}
      />,
      { setMode }
    )
    fireEvent.keyDown(window, { key: 'P', shiftKey: true })
    expect(setMode).toHaveBeenCalledWith('parent')
  })

  it('advances to next undone task when Next task clicked', async () => {
    const setActiveTaskId = vi.fn()
    const doneTask = {
      id: '1',
      text: 'Exercise',
      done: true,
      subtasks: [{ title: 'Run', done: true }],
    }
    const nextTask = { id: '2', text: 'Read', done: false, subtasks: [] }
    renderWithContext(
      <ChildScreen
        tasks={[doneTask, nextTask]}
        activeTask={doneTask}
        setTasks={() => {}}
        markDone={() => {}}
        updateTask={() => {}}
      />,
      { setActiveTaskId }
    )
    await userEvent.click(screen.getByRole('button', { name: /next task/i }))
    expect(setActiveTaskId).toHaveBeenCalledWith('2')
  })
})
