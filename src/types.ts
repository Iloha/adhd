export interface Subtask {
  title: string
  hint?: string
  subtask_hint?: string
  done: boolean
}

export interface Task {
  id: string
  text: string
  hint?: string
  done?: boolean
  subtasks?: Subtask[]
  created_at?: string
}

export type NewTask = Pick<Task, 'text' | 'hint' | 'subtasks'>
