import { useState } from "react"

function Addtext({ onAdd }) {
  
  const [text, setText] = useState('')
  const [subtask, setSubtask] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    onAdd({ text, subtask})

    setText('')
    setSubtask('')
  }


  return (
      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        <form onSubmit={onSubmit} className="task-form space-y-8">
          <fieldset className="task-form__line space-y-3">
            <label htmlFor="" className="task-form__label text-lg text-gray-900">Название задачи</label>
            <input type="text" className="task-form__textbox text-lg py-6 px-4 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-50" placeholder="" value={text} onChange={(e)=>setText(e.target.value)}/>
          </fieldset>
          <fieldset className="task-form__line space-y-3">
            <input type="text"  className="task-form__textbox"  placeholder="" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
            <input type="text" name="" placeholder="Hint" />
          </fieldset>
          <button>Cоздать задачу</button>
        </form>
      </div>
  )
}

export default Addtext
