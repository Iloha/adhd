"use client"

function Task ({task, onToggle, onEdit}) {

  const completed = task.subtasks ? task.subtasks.filter(s => s.done).length : 0
  const total = task.subtasks ? task.subtasks.length : 0
  const isDone = total > 0 ? completed === total : false
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <li className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-all cursor-pointer " key={task.id} onDoubleClick={() => onToggle(task.id)}>
      
      <div className='flex items-start justify-between mb-3'>
        <h3 className='task__text text-lg font-bold text-gray-900'>{task.text}</h3>
        <div className="flex items-center gap-2">
          { percent > 0 && (
          (isDone) ? (
            <span className="status-badge status-badge_done bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Done</span>
          ) : (
            <span className="status-badge status-badge_inprogress bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">In progress</span>
          ) )}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => onEdit(task.id)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
          </button>
        </div>
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