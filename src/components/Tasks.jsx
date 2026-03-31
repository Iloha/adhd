import Task from "./Task"

function Tasks( {tasks, onDelete, onToggle} ) {
  
  return (
    <div className="tasks-section w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-md">
      <ul className="task-list px-6 py-6 space-y-4">
        { tasks.map((task) => (
        <Task task={task} onDelete={onDelete} key={task.id} onToggle={onToggle}/>
      )) }
      </ul>
    </div>
  )
}

export default Tasks
