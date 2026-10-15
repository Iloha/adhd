"use client"

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
        <form onSubmit={onSubmit} className="space-y-8">
          <fieldset className="space-y-3 text-left"> 
            <label htmlFor="task-text" className="block text-lg font-bold text-gray-900">Task name<span className="text-red-700">*</span></label>
            <input id="task-text" type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" placeholder="e.g., Clean your room" value={text} onChange={(e)=>setText(e.target.value)}/>
          </fieldset>

          <fieldset className="space-y-3 text-left"> 
            <label htmlFor="task-hint" className="block text-lg font-bold text-gray-900">Hint (optional)</label>
            <input id="task-hint" type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" placeholder="e.g., Check under your bed" value={hint} onChange={(e)=>setHint(e.target.value)}/>
          </fieldset>


          <fieldset className="space-y-3 text-left">
            <label htmlFor="subtask-title" className="block text-lg font-bold text-gray-900">Subtask name</label>
            <input id="subtask-title" type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" placeholder="e.g., Pick up your toys" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
            <input type="text" className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700" value={subtask_hint} onChange={(e)=>setSubtaskHint(e.target.value)} aria-label="Subtask hint" placeholder="Hint (optional)" />
            <button type="button"  className="flex items-center gap-2 min-h-12 px-4 py-2 text-base font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => addSubtask(subtask)}>+ Add subtask</button>
          </fieldset>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-medium py-5 rounded-2xl transition-colors shadow-lg">{ button_text }</button>
        </form>
      </div>
  )
}

export default Addtext
