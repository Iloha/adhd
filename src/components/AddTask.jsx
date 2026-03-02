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
    <>
      <form onSubmit={onSubmit} className="task-form">
        <fieldset className="task-form__line">
          <label htmlFor="" className="task-form__label">Название задачи</label>
          <input type="text" className="task-form__textbox" placeholder="" value={text} onChange={(e)=>setText(e.target.value)}/>
        </fieldset>
        <p>Шаги задачи</p>
        <button>Add step</button>
        <fieldset className="task-form__line">
          <input type="text"  className="task-form__textbox"  placeholder="" value={subtask} onChange={(e)=>setSubtask(e.target.value)}/>
          <input type="text" name="" placeholder="Hint" />
        </fieldset>
        <button>Cоздать задачу</button>
        <button>Cancel changes</button>
      </form>
    </>
  )
}

export default Addtext
