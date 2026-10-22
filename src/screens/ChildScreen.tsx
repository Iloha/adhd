"use client"

import { useApp } from "../context/AppContext";
import Button from "../components/Button";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Task } from "../types";
import { useRouter } from "next/navigation";

interface ChildScreenProps {
  tasks: Task[]
  activeTask: Task
  setTasks: Dispatch<SetStateAction<Task[]>>
  markDone?: (id: string) => void
  updateTask?: (id: string, updates: Partial<Task>) => void
}

function ChildScreen({ tasks, activeTask, setTasks, markDone, updateTask }: ChildScreenProps) {
  const { setActiveTaskId } = useApp();
  const router = useRouter();
  const subtasks = activeTask.subtasks ?? []
  const activeSubtaskIndex = subtasks.findIndex((subtask) => subtask.done !== true)
  const activeSubtask = activeSubtaskIndex === -1 ? null : subtasks[activeSubtaskIndex]
  const hasActiveSubtask = activeSubtask !== null
  const isTaskDone = !hasActiveSubtask && (activeTask.done === true || subtasks.length > 0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShiftP = event.shiftKey && event.key.toLowerCase() === "p";

      if (isShiftP) {
        router.push("/parent");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  if (!activeTask) {
    return <div>child screen — Choose task</div>
  }

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
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.done === true)
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === activeTask.id) {
          return { ...task, subtasks: updatedSubtasks, ...(allDone && { done: true }) }
        }
        return task
      })
    })
    // persist updated subtasks to server
    if (typeof updateTask === 'function') {
      const updates: Partial<Task> = { subtasks: updatedSubtasks }
      if (allDone) updates.done = true
      updateTask(activeTask.id, updates)
    } else if (allDone && typeof markDone === 'function') {
      markDone(activeTask.id)
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
    <div className="flex flex-col items-center justify-center gap-6 p-6 pb-32">
      Child screen
      { !hasActiveSubtask && !isTaskDone && (
        <div className="mt-6 bg-white text-gray-900 rounded-2xl shadow-lg px-8 py-10 w-full max-w-3xl text-center">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight">{activeTask.text}</span>
        </div>
      )}

      { hasActiveSubtask && (<><div className="text-xl md:text-2xl font-semibold text-gray-700 text-center">
        {activeTask.text}
      </div>
      <div className="mt-2 text-center text-gray-500">
        <div className="text-xl">{subtasks.filter((subtask) => subtask.done === true).length + 1} / {subtasks.length} steps</div>
      </div>
      <div className="mt-6 bg-white text-gray-900 rounded-2xl shadow-lg px-8 py-10 w-full max-w-3xl text-center">
        {activeSubtask.emoji && <div aria-hidden className="text-6xl mb-4">{activeSubtask.emoji}</div>}
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight">{activeSubtask.title}</span>
        {activeSubtask.minutes ? <div className="mt-4 text-lg text-gray-600">{`~${activeSubtask.minutes} min`}</div> : null}
      </div>
      <div className="mt-4 text-center text-gray-500 italic">{hasActiveSubtask ? (activeSubtask.hint ?? activeSubtask.subtask_hint) : ''}</div></>)}

    
     { isTaskDone && (
       <div className="mt-6 bg-white text-gray-900 rounded-2xl shadow-xl px-6 py-10 max-w-2xl text-center flex-1 flex flex-col items-center justify-center w-full">
        <div className="text-8xl">
            ⭐
          </div>
        <p className="text-4xl">Great job!</p>
          <p className="mt-5 text-lg text-gray-500">You finished</p>
        <p className="mt-3 text-lg text-gray-500">{activeTask.text}</p>
      </div>
     )}

      {/* Bottom fixed action bar */}
      <div className="fixed left-0 right-0 bottom-6 flex justify-center">
        <div className="w-full max-w-3xl px-6">
          <div className="flex gap-4 justify-center">
            {(hasActiveSubtask || (!isTaskDone && subtasks.length === 0)) && (
              <Button onClick={handleSubtaskDone} className="w-full sm:w-44 whitespace-nowrap">
                Complete
              </Button>
            )}

            {isTaskDone && (
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

                
                