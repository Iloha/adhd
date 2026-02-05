import { useState } from "react"

function Addtext({ onAdd }) {
  
  const [text, setText] = useState('')
  const [subtask, setSubtask] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(0)
  const [reminder, setReminder] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    onAdd({ text, subtask, duration: Number(duration), reminder })

    setText('')
    setSubtask('')
    setTime('')
    setDuration('')
    setReminder(false)
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
        {/* <fieldset className="task-form__line">
          <label htmlFor="" className="task-form__label">Введите количество времени (минут)</label>
          <input type="number"  className="task-form__textbox" placeholder="30" value={duration} onChange={(e)=>setDuration(e.target.value)}/>
        </fieldset>
        <fieldset className="task-form__line">
          <label htmlFor="" className="task-form__label">Во сколько</label>
          <select name=""  className="task-form__select" id="" value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="" disabled>Выберите время</option>
            <option value="morning">Утро</option>
            <option value="afternoon">День</option>
            <option value="evening">Вечер</option>
          </select>
        </fieldset>
        <fieldset className="task-form__line">
          <label className="task-form__label">Set Reminder</label>  
          <input type="checkbox"  className="task-form__checkbox" checked={reminder}  onChange={(e)=>setReminder(e.currentTarget.checked)}/>
        </fieldset> */}
        <button>Cоздать задачу</button>
        <button>Cancel changes</button>
      </form>
    </>
  )
}

export default Addtext
