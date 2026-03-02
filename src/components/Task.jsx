import { useState } from 'react'
import {FaTimes} from 'react-icons/fa'

function Task ({task, onDelete, onToggle}) {

  const [done, setDone] = useState(false);
  
  return (
    <li className={`task ${task.reminder ? 'reminder': ''}`} key={task.id} onDoubleClick={() => onToggle(task.id)}>
      <p className='task__text'>{task.text}</p>
      <FaTimes className='task__delete' onClick={() => onDelete(task.id)}/>
      <ul>
          {task.subtasks.map ((subtask) => <li key={subtask.order}> {subtask.title} </li>)}
      </ul>
      <p>2 steps from 5 are finished</p>
      <button>Edit</button>
    </li>
  )
}

export default Task
