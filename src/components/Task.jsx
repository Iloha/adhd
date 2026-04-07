function Task ({task, onToggle, onEdit}) {

  const completed = task.subtasks ? task.subtasks.filter(s => s.done).length : 0
  const total = task.subtasks ? task.subtasks.length : 0
  const isDone = total > 0 ? completed === total : false
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <li className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-all cursor-pointer " key={task.id} onDoubleClick={() => onToggle(task.id)}>
      
      <div className='flex items-start justify-between mb-3'>
        <h3 className='task__text text-lg font-bold text-gray-900'>{task.text}</h3>
        <button onClick={() => onEdit(task.id)}>Edit</button>
        { percent > 0 && (
         (isDone) ? (
          <span className="status-badge status-badge_done bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Done</span>
        ) : (
          <span className="status-badge status-badge_inprogress bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">In progress</span>
        ) )}
      </div>
     
      {/* <FaTimes className='task__delete' onClick={() => onDelete(task.id)}/>     */}
      <p className='text-sm text-gray-600 mb-2'>{ completed } / { total } steps completed</p>

      {/* progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

    </li>
  )
}

export default Task

// {tasks ? tasks.filter(t => t.done).length : 0}