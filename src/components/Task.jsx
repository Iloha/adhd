import { useState } from 'react'
import {FaTimes} from 'react-icons/fa'

function Task ({task, onDelete, onToggle}) {

  const [done, setDone] = useState(false);
  
  return (
    <li className={`task ${task.reminder ? 'reminder': ''}`} key={task.id} onDoubleClick={() => onToggle(task.id)}>
      <p className='task__text'>{task.text}</p>
      <FaTimes className='task__delete' onClick={() => onDelete(task.id)}/>
      <p>{task.duration} min</p>
      <p>{task.subtask}</p>
      <fieldset>
        <input type="checkbox" checked={done}  onChange={(e)=>setDone(e.currentTarget.checked)} />
        <label htmlFor="">Done</label>
      </fieldset>
    </li>
  )
}

export default Task
