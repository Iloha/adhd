function ChildScreen({ tasks, activeTask, setTasks }) {

  if (!activeTask) {
    return <div>child screen — Choose task</div>
  }

  const subtasks = activeTask.subtasks ?? []
  const activeSubtaskIndex = subtasks.findIndex((subtask) => subtask.done !== true)
  const activeSubtask = activeSubtaskIndex === -1 ? null : subtasks[activeSubtaskIndex]
  const hasActiveSubtask = activeSubtask !== null

  const handleSetDone = () => {
    if (!hasActiveSubtask) {
      // No active subtask: mark the whole task done instead of crashing
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === activeTask.id ? { ...task, done: true } : task))
      )
      return
    }

    const updatedSubtasks = subtasks.map((subtask, index) => {
      if (index === activeSubtaskIndex) {
        return { ...subtask, done: true }
      }
      return subtask
    })

    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === activeTask.id) {
          return { ...task, subtasks: updatedSubtasks }
        }
        return task
      })
    })
  }

  return (
    <div>
      {activeTask.done === true ? "Done!" : ""}

      <div>Title <b>{activeTask.text}</b></div>
      <div>
        Progress { subtasks.filter((subtask) => subtask.done === true).length } from { subtasks.length }
      </div>
      
      <button onClick={handleSetDone}>Complete</button>

      <div>
        Subtask <b>{hasActiveSubtask ? activeSubtask.title : '— no active subtask —'}</b>
      </div>
      <div>Hint <b>{hasActiveSubtask ? activeSubtask.hint : ''}</b></div>

      {/* <div>
        Subtasks
        {subtasks.map((subtask, index) => (
          <div key={index}>{subtask.title} {subtask.order} { index }</div>
        ))}

        for 
      </div> */}
    </div>
  )
}

export default ChildScreen

                
                