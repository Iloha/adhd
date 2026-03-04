function ChildScreen ({ tasks, activeTask, setTasks}) {
    return (
        <div> child screen
            { !activeTask ? 'Choose task' : ''}
            { activeTask.id }
            {/* { activeTask.done === true ? 'Done!' : '' } */}
        </div>
    )
}

export default ChildScreen