import Task from "./Task"

function Tasks( {data, onDelete, onToggle} ) {
  
  return (
    <div className="tasks-section">
      <h3 className="title-h3">Список задач</h3>
      <ul className="task-list">
        { data.map((task) => (
        <Task task={task} onDelete={onDelete} key={task.id} onToggle={onToggle}/>
      )) }
      </ul>
    </div>
  )
}

export default Tasks
