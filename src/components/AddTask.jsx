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
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Task name<span className="text-red-500">*</span></label>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-700 focus:outline-none focus:border-blue-500" placeholder="e.g., Clean your room" value={text} onChange={(e)=>setText(e.target.value)}/>
          </fieldset>

          <fieldset className="task-form__line space-y-3 text-left">
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Subtask name</label>
            <input type="text"  className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-700 focus:outline-none focus:border-blue-500"  placeholder="e.g., Pick up your toys" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-700 focus:outline-none focus:border-blue-500" name="" placeholder="Hint" />
            <button type="button"  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => addSubtask(subtask)}>+ Add subtask</button>
          </fieldset>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xl font-medium py-5 rounded-2xl transition-colors shadow-lg">Save task</button>
        </form>
      </div>
  )
}

export default Addtext
