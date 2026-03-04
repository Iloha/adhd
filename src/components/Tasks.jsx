import Task from "./Task"

function Tasks( {tasks, onDelete, onToggle} ) {
  
  return (
    <div className="tasks-section">
      <ul className="task-list">
        { tasks.map((task) => (
        <Task task={task} onDelete={onDelete} key={task.id} onToggle={onToggle}/>
      )) }
      </ul>
    </div>
  )
}

export default Tasks
