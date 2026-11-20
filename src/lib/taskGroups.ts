import type { Task } from '../types'

/** A task is done when all its steps are done, or, for a task without steps, when `done` is true. */
export function isTaskDone(task: Task): boolean {
  const steps = task.subtasks ?? []
  return steps.length > 0 ? steps.every((step) => step.done === true) : task.done === true
}

export interface TaskGroups {
  /** Not done yet, in the order they came in (the saved order). */
  unfinished: Task[]
  /** Done, newest first. */
  done: Task[]
}

/**
 * Splits a list into unfinished (top) and done (bottom) tasks.
 * Tasks do not record when they were finished, so "newest first" uses when they were created;
 * tasks with the same (or no) creation time keep their list order.
 */
export function groupTasks(tasks: Task[]): TaskGroups {
  const unfinished: Task[] = []
  const done: Task[] = []
  for (const task of tasks) (isTaskDone(task) ? done : unfinished).push(task)
  done.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return { unfinished, done }
}
