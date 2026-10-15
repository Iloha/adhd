"use client"

import { useTasks } from "../../context/TasksContext"
import ParentScreen from "../../screens/ParentScreen"
import LoadingState from "../../components/LoadingState"

export default function ParentPage() {
  const { tasks, loading, error, deleteTask, markDone, addTask, updateTask } = useTasks()

  if (loading) return <LoadingState />

  return (
    <ParentScreen tasks={tasks} deleteTask={deleteTask} markDone={markDone} addTask={addTask} updateTask={updateTask} error={error} />
  )
}
