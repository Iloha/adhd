import { useApp } from "./context/AppContext";

import Header from './components/Header'
import ChildScreen from "./screens/ChildScreen"
import ParentScreen from "./screens/ParentScreen"

import { useState, useEffect } from 'react'
import './App.css'


function App() {
  const { mode, activeTaskId, setActiveTaskId } = useApp();
  const [tasks, setTasks] = useState([])

  useEffect( () => {
    const getTasks = async () => {
      const tasksFromServer = await fetchTasks()
      setTasks(tasksFromServer)
    }

    getTasks()
  }, [])

  useEffect(() => {
    if (activeTaskId || tasks.length === 0) return
    const firstUndone = tasks.find(t =>
      t.subtasks?.length > 0 ? !t.subtasks.every(s => s.done) : t.done !== true
    )
    setActiveTaskId(firstUndone ? firstUndone.id : tasks[0].id)
  }, [tasks, activeTaskId, setActiveTaskId])


  const activeTask = tasks.find(task => task.id === activeTaskId) ?? tasks[0]
  
  const fetchTasks = async () => {
      const res = await fetch(`http://localhost:5001/tasks`)
      const data = await res.json()
      
      return data
  }

  const fetchTask = async (id) => {
      const res = await fetch(`http://localhost:5001/tasks/${id}`)
      const data = await res.json()
      
      return data
  }

  const updateTask = async (id, updates) => {
    // fetch current task then apply updates and PUT
    const taskToUpdate = await fetchTask(id)
    const updTask = { ...taskToUpdate, ...updates }
    const res = await fetch(`http://localhost:5001/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(updTask)
    })

    const data = await res.json()

    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    return data
  }

  const addTask = async (task) => {
    const res = await fetch(`http://localhost:5001/tasks`, 
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
    await fetch(`http://localhost:5001/tasks/${id}`, {
      method: 'DELETE'
    })

    setTasks(tasks.filter((task) => task.id !== id))
  }


const markDone = async (id) => {
    const taskToMarkDone = await fetchTask(id)
    const updTask = {...taskToMarkDone, done: !taskToMarkDone.done}
    const res = await fetch(`http://localhost:5001/tasks/${id}`, {
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
      {mode === "child" ? (
        <ChildScreen tasks={tasks} activeTask={activeTask} setTasks={setTasks} markDone={markDone} updateTask={updateTask} />
      ) : (
        <ParentScreen tasks={tasks} deleteTask={deleteTask} markDone={markDone} addTask={addTask} />
      )}
        <Header name={"Daniil"} date={"October 30th"}/>        
    </>
  )
}

export default App
