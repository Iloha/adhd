import Task from "./Task"

import type { Task as TaskType } from '../types'

interface TasksProps {
  tasks: TaskType[]
  onDelete?: (id: string) => void
  onToggle?: (id: string) => void
  onEdit: (id: string) => void
  highlightId?: string | null
}

function Tasks( {tasks, onToggle, onEdit, highlightId = null}: TasksProps ) {
  
  return (
    <div className="">
      <ul className="px-6 py-6 space-y-4 text-left">
        { tasks.map((task) => (
        <Task task={task} key={task.id} onToggle={onToggle} onEdit={onEdit} highlighted={task.id === highlightId}/>
      )) }
      </ul>
    </div>
  )
}

export default Tasks
