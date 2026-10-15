"use client"

import { useTasks } from "../../context/TasksContext"
import ChildScreen from "../../screens/ChildScreen"
import LoadingState from "../../components/LoadingState"
import ErrorBanner from "../../components/ErrorBanner"

export default function ChildPage() {
  const { tasks, setTasks, activeTask, loading, error, markDone, updateTask } = useTasks()

  if (loading) return <LoadingState />

  if (!activeTask) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-xl">
        No tasks yet. Ask a parent to add one!
      </div>
    )
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-6"><ErrorBanner message={error} /></div>
      <ChildScreen tasks={tasks} activeTask={activeTask} setTasks={setTasks} markDone={markDone} updateTask={updateTask} />
    </>
  )
}
