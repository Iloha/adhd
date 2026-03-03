import { useState } from "react"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import AddTask from '../components/AddTask'

function ParentScreen ({ tasks, deleteTask, markDone, addTask}) {
    const [showAddTask, setShowAddTask] = useState(false)

    return (
        <div> parent screen
            {tasks && <Tasks data={tasks} onDelete={deleteTask} markDone={markDone}/>} 
            <Button text="Add a task" onClick={() => setShowAddTask(!showAddTask)}/>
            {showAddTask && <AddTask onAdd={addTask} />}

        </div>
    )
}

export default ParentScreen