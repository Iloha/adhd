import type { SupabaseClient } from '@supabase/supabase-js'
import type { Subtask } from '@/types'

export const DEMO_CHILD = { name: 'Alex', avatar: '🦊' }

type DemoStep = Required<Pick<Subtask, 'title' | 'hint' | 'minutes' | 'emoji'>>

function steps(list: DemoStep[]): Subtask[] {
  return list.map((step) => ({ ...step, done: false }))
}

export const DEMO_TASKS: { text: string; hint: string; subtasks: Subtask[] }[] = [
  {
    text: 'Clean your room',
    hint: 'Start with the biggest things you can see.',
    subtasks: steps([
      { title: 'Pick up trash from the floor', hint: 'Five items is enough to start.', minutes: 2, emoji: '🗑️' },
      { title: 'Put dirty clothes in the basket', hint: 'One big armful at a time.', minutes: 3, emoji: '🧺' },
      { title: 'Put toys back in the box', hint: 'Throw them in, no need to be neat.', minutes: 3, emoji: '🧸' },
      { title: 'Pull up your blanket on the bed', hint: 'Smooth it with your hands.', minutes: 2, emoji: '🛏️' },
    ]),
  },
  {
    text: 'Get ready for school',
    hint: 'You can do it before the timer ends!',
    subtasks: steps([
      { title: 'Get dressed', hint: 'Pick the clothes you laid out.', minutes: 4, emoji: '👕' },
      { title: 'Brush your teeth', hint: 'Two minutes, sing a song.', minutes: 2, emoji: '🪥' },
      { title: 'Pack your school bag', hint: 'Check your homework folder.', minutes: 3, emoji: '🎒' },
      { title: 'Put on your shoes', hint: 'Almost out the door!', minutes: 1, emoji: '👟' },
    ]),
  },
  {
    text: 'Do your reading homework',
    hint: 'A short break after is your reward.',
    subtasks: steps([
      { title: 'Clear your desk and sit down', hint: 'Just you and your book.', minutes: 2, emoji: '🪑' },
      { title: 'Read for 10 minutes', hint: 'Set a timer so you know when to stop.', minutes: 5, emoji: '📖' },
      { title: 'Write down 3 things you remember', hint: 'Short notes are fine.', minutes: 4, emoji: '✏️' },
    ]),
  },
]

/**
 * Seeds one child profile and three sample tasks for a brand-new demo user.
 * Runs with the user's own session, so row-level security applies (no service role).
 * Safe to call repeatedly: it does nothing if the user already has a child profile.
 * Returns true if it seeded.
 */
export async function seedDemoData(supabase: SupabaseClient): Promise<boolean> {
  const { count, error: countError } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
  if (countError) throw countError
  if ((count ?? 0) > 0) return false

  const { data: child, error: childError } = await supabase
    .from('children')
    .insert(DEMO_CHILD)
    .select('id')
    .single()
  if (childError) throw childError

  const { error: tasksError } = await supabase
    .from('tasks')
    .insert(DEMO_TASKS.map((task) => ({ ...task, child_id: child.id, done: false })))
  if (tasksError) throw tasksError

  return true
}
