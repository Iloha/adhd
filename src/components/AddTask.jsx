import { useState, useEffect } from "react"
import { useApp } from "../context/AppContext.jsx"

function Addtext({ onAdd, onUpdate, mode, tasks,setScreen }) {
  const { activeTaskId } = useApp()
  const editTask = mode === 'edit' ? tasks?.find(t => t.id === activeTaskId) : null

  const [text, setText] = useState('')
  const [hint, setHint] = useState('')
  const [subtasks, setSubtasks] = useState([])
  const [subtask, setSubtask] = useState('')
  const [subtask_hint, setSubtaskHint] = useState('')

  useEffect(() => {
    if (editTask) {
      setText(editTask.text ?? '')
      setHint(editTask.hint ?? '')
      setSubtasks(editTask.subtasks ?? [])
    }
  }, [editTask?.id])

  const onSubmit = (e) => {
    e.preventDefault()
    if (mode === 'edit') {
      onUpdate(activeTaskId, { text, hint, subtasks })
      setScreen('tasks')
    } else {
      onAdd({ text, hint, subtasks })
    }

    setText('')
    setHint('')
    setSubtasks([])
  }

  const addSubtask = (subtask) => {
    const newSubtask = { title: subtask, subtask_hint: subtask_hint, done: false }
    setSubtasks([...subtasks, newSubtask])
    setSubtask('')
    setSubtaskHint('')
  }

  const button_text = mode === 'edit' ? 'Save changes' : 'Create task'
  return (
      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        <form onSubmit={onSubmit} className="task-form space-y-8">
          <fieldset className="task-form__line space-y-3 text-left"> 
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Task name<span className="text-red-500">*</span></label>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-500 focus:outline-none focus:border-blue-500" placeholder="e.g., Clean your room" value={text} onChange={(e)=>setText(e.target.value)}/>
          </fieldset>

          <fieldset className="task-form__line space-y-3 text-left"> 
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Hint (optional)</label>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-500 focus:outline-none focus:border-blue-500" placeholder="e.g., Check under your bed" value={hint} onChange={(e)=>setHint(e.target.value)}/>
          </fieldset>


          <fieldset className="task-form__line space-y-3 text-left">
            <label htmlFor="" className="task-form__label block text-lg font-bold text-gray-900">Subtask name</label>
            <input type="text"  className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-500 focus:outline-none focus:border-blue-500"  placeholder="e.g., Pick up your toys" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
            <input type="text" className="task-form__textbox w-full text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-300 text-gray-00 placeholder-gray-500 focus:outline-none focus:border-blue-500" value={subtask_hint} onChange={(e)=>setSubtaskHint(e.target.value)} name="" placeholder="Hint (optional)" />
            <button type="button"  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => addSubtask(subtask)}>+ Add subtask</button>
          </fieldset>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xl font-medium py-5 rounded-2xl transition-colors shadow-lg">{ button_text }</button>
        </form>
      </div>
  )
}

export default Addtext
