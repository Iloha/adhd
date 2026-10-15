"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useApp } from "./AppContext"

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const { activeTaskId, setActiveTaskId } = useApp()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const getTasks = async () => {
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true })
      if (err) {
        console.error('Error loading tasks:', err)
        setError('Failed to load tasks. Please refresh the page.')
      } else {
        setTasks(data || [])
      }
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

  const updateTask = async (id, updates) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (err) {
      console.error('Error updating task:', err)
      setError('Failed to update task. Please try again.')
      return
    }
    setError(null)
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    return data
  }

  const addTask = async (task) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()
    if (err) {
      console.error('Error adding task:', err)
      setError('Failed to add task. Please try again.')
      return
    }
    setError(null)
    setTasks((prev) => [...prev, data])
  }

  const deleteTask = async (id) => {
    const { error: err } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    if (err) {
      console.error('Error deleting task:', err)
      setError('Failed to delete task. Please try again.')
      return
    }
    setError(null)
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const markDone = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const { error: err } = await supabase
      .from('tasks')
      .update({ done: !task.done })
      .eq('id', id)
    if (err) {
      console.error('Error marking task done:', err)
      setError('Failed to update task. Please try again.')
      return
    }
    setError(null)
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  }

  const value = { tasks, setTasks, activeTask, loading, error, addTask, updateTask, deleteTask, markDone }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks() {
  return useContext(TasksContext)
}
