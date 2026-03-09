function ChildScreen({ tasks, activeTask, setTasks }) {
  if (!activeTask) {
    return <div>child screen — Choose task</div>
  }

  const subtasks = activeTask.subtasks ?? []
  const activeSubtaskIndex = subtasks.findIndex((subtask) => subtask.done !== true)
  const activeSubtask = activeSubtaskIndex === -1 ? null : subtasks[activeSubtaskIndex]

//   console.log ('index', activeSubtaskIndex, 'title', activeSubtask)
  return (
    <div>
      <b>Child screen</b>
      {activeTask.done === true ? "Done!" : ""}
      <div>{activeTask.id}</div>
      <div>Title {activeTask.text}</div>
      <div>Subtask { activeSubtask.title }</div>
      
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

                
                