import { useApp } from "../context/AppContext";

function ChildScreen({ tasks, activeTask, setTasks, markDone, updateTask }) {
  const { setActiveTaskId } = useApp();

  if (!activeTask) {
    return <div>child screen — Choose task</div>
  }

  const subtasks = activeTask.subtasks ?? []
  const activeSubtaskIndex = subtasks.findIndex((subtask) => subtask.done !== true)
  const activeSubtask = activeSubtaskIndex === -1 ? null : subtasks[activeSubtaskIndex]
  const hasActiveSubtask = activeSubtask !== null

  const handleSubtaskDone = () => {
    if (!hasActiveSubtask) {
      // No active subtask: mark the whole task done instead of crashing
      // update local state immediately
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === activeTask.id ? { ...task, done: true } : task))
        )
        // persist via updateTask (preferred) or markDone as fallback
        if (typeof updateTask === 'function') {
          updateTask(activeTask.id, { done: true })
        } else if (typeof markDone === 'function') {
          markDone(activeTask.id)
        }
      return
    }

    const updatedSubtasks = subtasks.map((subtask, index) => {
      if (index === activeSubtaskIndex) {
        return { ...subtask, done: true }
      }
      return subtask
    })

    // update local subtasks immediately for snappy UI
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === activeTask.id) {
          return { ...task, subtasks: updatedSubtasks }
        }
        return task
      })
    })
    // persist updated subtasks to server
    if (typeof updateTask === 'function') {
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.done === true)
      const updates = { subtasks: updatedSubtasks }
      if (allDone) updates.done = true
      updateTask(activeTask.id, updates)
    } else {
      // fallback: if no updateTask helper is provided, toggle task done when all subtasks complete
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.done === true)
      if (allDone && typeof markDone === 'function') {
        markDone(activeTask.id)
      }
    }
  }

  const handleNextTask = () => {
    if (!tasks || tasks.length === 0) return
    const currentIndex = tasks.findIndex((t) => t.id === activeTask.id)
    const len = tasks.length
    // find next task that is not done, wrapping around
    for (let offset = 1; offset < len; offset++) {
      const idx = (currentIndex + offset) % len
      const candidate = tasks[idx]
      if (candidate && candidate.done !== true) {
        if (typeof setActiveTaskId === 'function') setActiveTaskId(candidate.id)
        return
      }
    }
    // no not-done task found: do nothing (stay on current task)
  }

  return (
    <div>
      <div><b>{activeTask.text}</b></div>
      <div>
        Progress { subtasks.filter((subtask) => subtask.done === true).length } from { subtasks.length }
      </div>

      <div>
        {hasActiveSubtask ? <b>{activeSubtask.title}</b> : '— no active subtask —'}
        {hasActiveSubtask && <button onClick={handleSubtaskDone}>Complete</button>}
      </div>
      <div><b>{hasActiveSubtask ? activeSubtask.hint : ''}</b></div>

     { activeTask.done === true && <div>
        <p>🎉 Awesome!</p>
        <p>{subtasks.length} / {subtasks.length} steps completed</p>
        <p>You did it!</p>
        <button onClick={handleNextTask}>Next task</button>
      </div> }
     
     
    </div>
  )
}

export default ChildScreen

                
                