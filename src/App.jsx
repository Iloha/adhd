import Header from './components/Header'
import AddTask from './components/AddTask'
import Tasks from './components/Tasks'
import Button from "./components/Button"

import { useState, useEffect } from 'react'
import './App.css'


function App() {
  // const [count, setCount] = useState(0)
  const [tasks, setTasks] = useState([])
  const [showAddTask, setShowAddTask] = useState(false)

  useEffect( () => {
    const getTasks = async () => {
      const tasksFromServer = await fetchTasks()
      setTasks(tasksFromServer)
    }

    getTasks()
  }, [])

  const fetchTasks = async () => {
      const res = await fetch(`http://localhost:5000/tasks`)
      const data = await res.json()
      
      return data
  }

  const fetchTask = async (id) => {
      const res = await fetch(`http://localhost:5000/tasks/${id}`)
      const data = await res.json()
      
      return data
  }

  const addTask = async (task) => {
    const res = await fetch(`http://localhost:5000/tasks`, 
      {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(task)
      }
    )

    const data = await res.json()

    setTasks([...tasks, data])
  }

  const deleteTask = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'DELETE'
    })

    setTasks(tasks.filter((task) => task.id !== id))
  }

  const toggleReminder = async (id) => {
    const taskToToggle = await fetchTask(id)
    const updTask = {...taskToToggle, reminder: !taskToToggle.reminder}
    const res = await fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-type': "application/json",
      },
      body: JSON.stringify(updTask)
    })

    const data = await res.json()

   setTasks(
    tasks.map((task) => 
      task.id === id ? { ...task, reminder: !task.reminder } : task
    )
  );
  }

const markDone = async (id) => {
    const taskToMarkDone = await fetchTask(id)
    const updTask = {...taskToMarkDone, done: !taskToMarkDone.done}
    const res = await fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-type': "application/json",
      },
      body: JSON.stringify(updTask)
    })

    const data = await res.json()

   setTasks(
    tasks.map((task) => 
      task.id === id ? { ...task, done: !task.done } : task
    )
  );
  }
  
  return (
    <>
      <Header name={"Daniil"} date={"October 30th"}/>
      <Button text="Add a task" onClick={() => setShowAddTask(!showAddTask)}/>
        {/* {showForm ? 'Close Form' : 'Add Task'} */}

      {showAddTask && <AddTask onAdd={addTask} />}

      {tasks && <Tasks data={tasks} onDelete={deleteTask} onToggle={toggleReminder} markDone={markDone}/>}
      
     

     

      {/* <div className="card-day">
        <div>Задача
          подзадачи
          чекбокс сделано ли
          иконка
          звездочка ?
        </div>
      </div> */}

    </>
  )
}

export default App
