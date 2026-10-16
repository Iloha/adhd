import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AddTask from '../components/AddTask'
import { renderWithContext } from './helpers'

const existing = {
  id: '7',
  text: 'Clean room',
  hint: 'Start with the floor',
  done: false,
  subtasks: [{ title: 'Pick up toys', hint: 'Under the bed', done: false }],
}

describe('AddTask', () => {
  it('submits a new task with name and hint', async () => {
    const onAdd = vi.fn()
    renderWithContext(
      <AddTask onAdd={onAdd} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    await userEvent.type(screen.getByLabelText(/^hint/i), 'Two minutes')
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(onAdd).toHaveBeenCalledWith({ text: 'Brush teeth', hint: 'Two minutes', subtasks: [] })
  })

  it('adds a subtask with its hint and clears the subtask inputs', async () => {
    const onAdd = vi.fn()
    renderWithContext(
      <AddTask onAdd={onAdd} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Clean room')
    await userEvent.type(screen.getByLabelText(/subtask name/i), 'Pick up toys')
    await userEvent.type(screen.getByLabelText(/subtask hint/i), 'Under the bed')
    await userEvent.click(screen.getByRole('button', { name: /add subtask/i }))
    expect(screen.getByLabelText(/subtask name/i)).toHaveValue('')
    expect(screen.getByLabelText(/subtask hint/i)).toHaveValue('')

    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(onAdd).toHaveBeenCalledWith({
      text: 'Clean room',
      hint: '',
      subtasks: [{ title: 'Pick up toys', hint: 'Under the bed', done: false }],
    })
  })

  it('resets the form after creating a task', async () => {
    renderWithContext(
      <AddTask onAdd={() => {}} onUpdate={() => {}} mode="create" tasks={[]} setScreen={() => {}} />
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), 'Brush teeth')
    await userEvent.click(screen.getByRole('button', { name: /create task/i }))
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('')
  })

  it('pre-fills the form from the active task in edit mode', () => {
    renderWithContext(
      <AddTask onAdd={() => {}} onUpdate={() => {}} mode="edit" tasks={[existing]} setScreen={() => {}} />,
      { activeTaskId: '7' }
    )
    expect(screen.getByLabelText(/^task name/i)).toHaveValue('Clean room')
    expect(screen.getByLabelText(/^hint/i)).toHaveValue('Start with the floor')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('updates the task and returns to the list in edit mode', async () => {
    const onUpdate = vi.fn()
    const setScreen = vi.fn()
    renderWithContext(
      <AddTask onAdd={() => {}} onUpdate={onUpdate} mode="edit" tasks={[existing]} setScreen={setScreen} />,
      { activeTaskId: '7' }
    )
    await userEvent.type(screen.getByLabelText(/^task name/i), ' now')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(onUpdate).toHaveBeenCalledWith('7', {
      text: 'Clean room now',
      hint: 'Start with the floor',
      subtasks: existing.subtasks,
    })
    expect(setScreen).toHaveBeenCalledWith('tasks')
  })
})
