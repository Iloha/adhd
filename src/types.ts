export interface Subtask {
  title: string
  hint?: string
  /** Estimated minutes for this step (AI-suggested steps only). */
  minutes?: number
  emoji?: string
  /** Legacy field: subtasks saved before the fix stored their hint here. */
  subtask_hint?: string
  done: boolean
}

export interface Task {
  id: string
  text: string
  hint?: string
  done?: boolean
  subtasks?: Subtask[]
  /** The child this task belongs to, or null/undefined when it is not assigned to a child. */
  child_id?: string | null
  created_at?: string
}

export interface Child {
  id: string
  name: string
  avatar: string | null
  created_at?: string
}

export type NewTask = Pick<Task, 'text' | 'hint' | 'subtasks'>
