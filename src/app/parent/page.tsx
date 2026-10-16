"use client"

import { useTasks } from "../../context/TasksContext"
import ParentScreen from "../../screens/ParentScreen"
import LoadingState from "../../components/LoadingState"

export default function ParentPage() {
  const {
    tasks, loading, error, deleteTask, markDone, addTask, updateTask,
    children, selectedChildId, setSelectedChildId, addChild, renameChild, deleteChild,
  } = useTasks()

  if (loading) return <LoadingState />

  return (
    <ParentScreen
      tasks={tasks}
      deleteTask={deleteTask}
      markDone={markDone}
      addTask={addTask}
      updateTask={updateTask}
      error={error}
      family={{
        children,
        selectedChildId,
        onSelectChild: setSelectedChildId,
        onAddChild: addChild,
        onRenameChild: renameChild,
        onDeleteChild: deleteChild,
      }}
    />
  )
}
