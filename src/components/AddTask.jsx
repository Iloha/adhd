import { useState } from "react"

function Addtext({ onAdd }) {
  
  const [text, setText] = useState('')
  const [subtasks, setSubtasks] = useState([])
  const [subtask, setSubtask] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    onAdd({ text, subtasks})

    setText('')
    setSubtasks('')
  }

  const addSubtask = (subtask) => {
    const newSubtask = { title: subtask, hint: '', done: false }
    setSubtasks([...subtasks, newSubtask])
    setSubtask([])  
  }
  return (
      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        <form onSubmit={onSubmit} className="task-form space-y-8">
          <fieldset className="task-form__line space-y-3 text-left"> 
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Название задачи <span className="text-red-500">*</span></label>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-700 focus:outline-none focus:border-blue-500" placeholder="e.g., Clean your room" value={text} onChange={(e)=>setText(e.target.value)}/>
          </fieldset>

          <fieldset className="task-form__line space-y-3 text-left">
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Subtask name</label>
            <input type="text"  className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-700 focus:outline-none focus:border-blue-500"  placeholder="" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-700 focus:outline-none focus:border-blue-500" name="" placeholder="Hint" />
            <button type="button" onClick={() => addSubtask(subtask)}>Create subtask</button>
          </fieldset>

          <button type="submit">Cоздать задачу</button>
        </form>
      </div>
  )
}

export default Addtext
