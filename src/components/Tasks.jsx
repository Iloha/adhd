import Task from "./Task"

function Tasks( {tasks, onDelete, onToggle, onEdit} ) {
  
  return (
    <div className="">
      <ul className="px-6 py-6 space-y-4 text-left">
        { tasks.map((task) => (
        <Task task={task} onDelete={onDelete} key={task.id} onToggle={onToggle} onEdit={onEdit}/>
      )) }
      </ul>
    </div>
  )
}

export default Tasks
