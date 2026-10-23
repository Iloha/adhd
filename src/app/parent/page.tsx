"use client"

import { useTasks } from "../../context/TasksContext"
import ParentScreen from "../../screens/ParentScreen"
import LoadingState from "../../components/LoadingState"
import { useAccount } from "../../lib/useAccount"

export default function ParentPage() {
  const {
    tasks, loading, error, deleteTask, markDone, addTask, updateTask,
    children, selectedChildId, setSelectedChildId, addChild, renameChild, deleteChild,
  } = useTasks()

  const account = useAccount()

  if (loading) return <LoadingState />

  return (
    <ParentScreen
      tasks={tasks}
      deleteTask={deleteTask}
      markDone={markDone}
      addTask={addTask}
      updateTask={updateTask}
      error={error}
      account={account}
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
