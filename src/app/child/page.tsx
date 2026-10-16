"use client"

import { useTasks } from "../../context/TasksContext"
import ChildScreen from "../../screens/ChildScreen"
import LoadingState from "../../components/LoadingState"
import ErrorBanner from "../../components/ErrorBanner"
import Header from "../../components/Header"
import ParentLock from "../../components/ParentLock"

export default function ChildPage() {
  const { tasks, setTasks, activeTask, loading, error, markDone, updateTask, children, selectedChildId } = useTasks()

  if (loading) return <LoadingState />

  const child = children.find((c) => c.id === selectedChildId)

  return (
    <>
      <ParentLock />
      <Header child={child} />
      {!activeTask ? (
        <div className="min-h-screen flex items-center justify-center text-gray-500 text-xl">
          No tasks yet. Ask a parent to add one!
        </div>
      ) : (
        <>
          <div className="max-w-3xl mx-auto px-6"><ErrorBanner message={error} /></div>
          <ChildScreen tasks={tasks} activeTask={activeTask} setTasks={setTasks} markDone={markDone} updateTask={updateTask} />
        </>
      )}
    </>
  )
}
