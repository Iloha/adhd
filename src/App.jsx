import { useApp } from "./context/AppContext";

import Header from './components/Header'
import ChildScreen from "./screens/ChildScreen"
import ParentScreen from "./screens/ParentScreen"
import { supabase } from "./lib/supabaseClient";

import { useState, useEffect } from 'react'
import './App.css'


function App() {
  const { mode, activeTaskId, setActiveTaskId } = useApp();
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect( () => {
    const getTasks = async () => {
      const tasksFromServer = await fetchTasks()
      setTasks(tasksFromServer)
      setLoading(false)
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
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading tasks:', error)
      return []
    }

    return data || []
  }

  // const fetchTask = async (id) => {
  //   const { data, error } = await supabase
  //     .from('tasks')
  //     .select('*')
  //     .eq('id', id)
  //     .single()

  //   if (error) {
  //     console.error('Error loading task:', error)
  //     return null
  //   }

  //   return data
  // }

  const updateTask = async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return
    }

    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    return data
  }

  const addTask = async (task) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) {
      console.error('Error adding task:', error)
      return
    }

    setTasks((prev) => [...prev, data])
  }

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return
    }

    setTasks((prev) => prev.filter((task) => task.id !== id))
  }


  const markDone = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done })
      .eq('id', id)

    if (error) {
      console.error('Error marking task done:', error)
      return
    }

    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  }
  
  console.log(activeTask)

  if (loading) return null

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
