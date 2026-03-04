function ChildScreen({ tasks, activeTask, setTasks }) {
  if (!activeTask) {
    return <div>child screen — Choose task</div>
  }

  const subtasks = activeTask.subtasks ?? []

  return (
    <div>
      child screen
      {activeTask.done === true ? "Done!" : ""}
      <div>{activeTask.id}</div>

      <div>Title {activeTask.text}</div>

      <div>
        subtasks
        {subtasks.map((subtask) => (
          <div key={subtask.order}>{subtask.title} {subtask.order}</div>
        ))}
        <div>
            sorted subtasks
            {[...subtasks]
                .sort((a, b) => a.order - b.order)
                .map((subtask) => (
                <div key={subtask.order}>{subtask.title}</div>
                ))}
            </div>
      </div>
    </div>
  )
}

export default ChildScreen

                
                