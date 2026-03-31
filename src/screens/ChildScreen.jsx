import { useApp } from "../context/AppContext";
import Button from "../components/Button";

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
    <div className="child-screen flex flex-col items-center justify-center gap-6 p-6">
      { hasActiveSubtask && <div className="child-screen__active-task text-xl md:text-2xl font-semibold text-gray-700 text-center">
        {activeTask.text}
      </div>}
      { hasActiveSubtask && <div className="child-screen__progress mt-2 text-center text-gray-500">
        <div className="text-xl">{subtasks.filter((subtask) => subtask.done === true).length + 1} / {subtasks.length} steps</div>
      </div>}

      { hasActiveSubtask ? <div className="child-screen__active-subtask mt-6 bg-white text-gray-900 rounded-2xl shadow-lg px-8 py-10 w-full max-w-3xl text-center">
        <span className="text-3xl font-semibold tracking-tight">{activeSubtask.title}</span>
      </div> : ''}
    <div className="child-screen__active-subtask-hint mt-4 text-center text-gray-500 italic">{hasActiveSubtask ? activeSubtask.hint : ''}</div>
     { activeTask.done === true && <div className="child-screen__completed-message mt-6  rounded-2xl shadow-lg px-8 py-10 w-full max-w-3xl text-center">
        <p className="text-3xl font-semibold">Great job!</p>
        <p>You finished</p>
        <p>{ activeTask.text }</p>
      </div> }

      {/* Bottom fixed action bar */}
      <div className="fixed left-0 right-0 bottom-6 flex justify-center">
        <div className="w-full max-w-3xl px-6">
          <div className="flex gap-4 justify-center">
            {hasActiveSubtask && (
              <Button onClick={handleSubtaskDone} className="w-full sm:w-44 whitespace-nowrap">
                Complete
              </Button>
            )}

            {activeTask.done === true && (
              <Button variant="secondary" onClick={handleNextTask} className="w-full sm:w-64 whitespace-nowrap">
                Next task
              </Button>
            )}
          </div>
        </div>
      </div>
     
     
    </div>
  )
}

export default ChildScreen

                
                