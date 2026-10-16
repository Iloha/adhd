import Task from "./Task"

import type { Task as TaskType } from '../types'

interface TasksProps {
  tasks: TaskType[]
  onDelete?: (id: string) => void
  onToggle?: (id: string) => void
  onEdit: (id: string) => void
}

function Tasks( {tasks, onToggle, onEdit}: TasksProps ) {
  
  return (
    <div className="">
      <ul className="px-6 py-6 space-y-4 text-left">
        { tasks.map((task) => (
        <Task task={task} key={task.id} onToggle={onToggle} onEdit={onEdit}/>
      )) }
      </ul>
    </div>
  )
}

export default Tasks
