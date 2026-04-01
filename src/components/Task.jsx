function Task ({task, onToggle}) {

  const isDone = task.subtasks.every(s => s.done)
  // const inProgress = task.subtasks.some(s => s.done)
  
  return (
    <li className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-all cursor-pointer " key={task.id} onDoubleClick={() => onToggle(task.id)}>
      
      <div className='flex items-start justify-between mb-3'>
        <h3 className='task__text text-lg font-bold text-gray-900'>{task.text}</h3>
        { task.subtasks.filter(s => s.done).length !== 0 &&
        isDone ? <span className="status-badge status-badge_done bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Done</span> : <span className="status-badge status-badge_inprogress bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">In progress</span>
       }
      </div>
     
      {/* <FaTimes className='task__delete' onClick={() => onDelete(task.id)}/>     */}
      <p className='text-sm text-gray-600 mb-2'>{ task.subtasks.filter(s => s.done).length } / { task.subtasks.length } steps completed</p>
  
    </li>
  )
}

export default Task

// {tasks ? tasks.filter(t => t.done).length : 0}