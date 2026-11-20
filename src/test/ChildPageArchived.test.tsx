import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChildPage from '../app/child/page'

const { useTasks, childScreen } = vi.hoisted(() => ({ useTasks: vi.fn(), childScreen: vi.fn() }))
vi.mock('../context/TasksContext', () => ({ useTasks }))
vi.mock('../screens/ChildScreen', () => ({ default: (props: unknown) => { childScreen(props); return null } }))
vi.mock('../components/ParentLock', () => ({ default: () => null }))
vi.mock('../components/Header', () => ({ default: () => null }))

describe('ChildPage with archived tasks', () => {
  it('only hands the tasks that are not archived to the child screen', () => {
    const open = { id: '1', text: 'Brush teeth', done: false, subtasks: [] }
    const archived = { id: '2', text: 'Old task', done: false, subtasks: [], archived: true }
    useTasks.mockReturnValue({
      tasks: [open, archived], setTasks: vi.fn(), activeTask: open, loading: false, error: null,
      markDone: vi.fn(), updateTask: vi.fn(), children: [], selectedChildId: null,
    })
    render(<ChildPage />)
    expect(childScreen).toHaveBeenCalledTimes(1)
    expect(childScreen.mock.calls[0][0].tasks).toEqual([open])
  })
})
