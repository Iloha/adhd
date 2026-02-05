import { useState } from 'react'
import {FaTimes} from 'react-icons/fa'

function Task ({task, onDelete, onToggle}) {

  const [done, setDone] = useState(false);
  
  return (
    <li className={`task ${task.reminder ? 'reminder': ''}`} key={task.id} onDoubleClick={() => onToggle(task.id)}>
      <p className='task__text'>{task.text}</p>
      <FaTimes className='task__delete' onClick={() => onDelete(task.id)}/>
      {/* <p>{task.subtask}</p> */}
      <p>2 steps from 5 are finished</p>
      <button>Edit</button>
      {/* <fieldset>
        <input type="checkbox" checked={done}  onChange={(e)=>setDone(e.currentTarget.checked)} />
        <label htmlFor="">Done</label>
      </fieldset> */}
    </li>
  )
}

export default Task
