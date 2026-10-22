import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_CHILD, DEMO_TASKS, seedDemoData } from '../lib/demo'

function fakeClient({ existing = 0 } = {}) {
  const insertTasks = vi.fn().mockResolvedValue({ error: null })
  const insertChild = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { id: 'child-1' }, error: null }) }) }))
  const client = {
    from: (table: string) =>
      table === 'children'
        ? { select: () => Promise.resolve({ count: existing, error: null }), insert: insertChild }
        : { insert: insertTasks },
  } as unknown as SupabaseClient
  return { client, insertTasks, insertChild }
}

describe('seedDemoData', () => {
  it('creates one child and attaches every sample task to it', async () => {
    const { client, insertChild, insertTasks } = fakeClient()
    expect(await seedDemoData(client)).toBe(true)
    expect(insertChild).toHaveBeenCalledWith(DEMO_CHILD)
    const rows = insertTasks.mock.calls[0][0]
    expect(rows).toHaveLength(DEMO_TASKS.length)
    expect(rows.every((r: { child_id: string; done: boolean }) => r.child_id === 'child-1' && r.done === false)).toBe(true)
  })

  it('never sends user_id (the database fills it from the session)', async () => {
    const { client, insertTasks } = fakeClient()
    await seedDemoData(client)
    expect(insertTasks.mock.calls[0][0][0]).not.toHaveProperty('user_id')
  })

  it('does nothing when the user already has a child profile', async () => {
    const { client, insertChild, insertTasks } = fakeClient({ existing: 1 })
    expect(await seedDemoData(client)).toBe(false)
    expect(insertChild).not.toHaveBeenCalled()
    expect(insertTasks).not.toHaveBeenCalled()
  })

  it('uses the hint field on every sample step', () => {
    for (const task of DEMO_TASKS) for (const step of task.subtasks) expect(step.hint).toBeTruthy()
  })
})
