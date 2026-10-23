"use client"

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { createClient } from "../lib/supabase/client"
import { useApp } from "./AppContext"
import type { Child, NewTask, Task } from "../types"

interface TasksContextValue {
  children: Child[]
  /** The child whose tasks are shown. null = tasks that are not assigned to a child. */
  selectedChildId: string | null
  setSelectedChildId: (id: string | null) => void
  addChild: (name: string, avatar: string) => Promise<boolean>
  renameChild: (id: string, name: string) => Promise<boolean>
  /** Also deletes that child's tasks (ON DELETE CASCADE). The UI must ask first. */
  deleteChild: (id: string) => Promise<boolean>
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
  activeTask: Task | undefined
  loading: boolean
  error: string | null
  addTask: (task: NewTask) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | undefined>
  deleteTask: (id: string) => Promise<void>
  markDone: (id: string) => Promise<void>
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children, forcedChildId = null }: { children: ReactNode; forcedChildId?: string | null }) {
  const [supabase] = useState(() => createClient())
  const { activeTaskId, setActiveTaskId } = useApp()
  const [childProfiles, setChildProfiles] = useState<Child[]>([])
  const [childrenLoaded, setChildrenLoaded] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Load the family's child profiles and select the first one.
  useEffect(() => {
    let cancelled = false
    const getChildren = async () => {
      const { data, error: err } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true })
      if (cancelled) return
      if (err) {
        console.error('Error loading children:', err)
        setError('Failed to load tasks. Please refresh the page.')
      } else {
        const list = (data as Child[]) || []
        setChildProfiles(list)
        // In child mode the cookie decides which child is shown.
        const forced = forcedChildId && list.some((c) => c.id === forcedChildId) ? forcedChildId : null
        setSelectedChildId(forced ?? list[0]?.id ?? null)
      }
      setChildrenLoaded(true)
    }

    getChildren()
    return () => { cancelled = true }
  }, [supabase, forcedChildId])

  // 2. Load the selected child's tasks (and reload when the selection changes).
  // user_id is never sent or filtered by the client: row-level security scopes the query.
  useEffect(() => {
    if (!childrenLoaded) return
    let cancelled = false
    const getTasks = async () => {
      setLoading(true)
      setActiveTaskId(null)
      const base = supabase.from('tasks').select('*')
      const { data, error: err } = await (selectedChildId
        ? base.eq('child_id', selectedChildId)
        : base.is('child_id', null)
      ).order('created_at', { ascending: true })
      if (cancelled) return
      if (err) {
        console.error('Error loading tasks:', err)
        setError('Failed to load tasks. Please refresh the page.')
        setTasks([])
      } else {
        setTasks((data as Task[]) || [])
      }
      setLoading(false)
    }

    getTasks()
    return () => { cancelled = true }
  }, [supabase, childrenLoaded, selectedChildId, setActiveTaskId])

  useEffect(() => {
    if (activeTaskId || tasks.length === 0) return
    const firstUndone = tasks.find(t =>
      t.subtasks && t.subtasks.length > 0 ? !t.subtasks.every(s => s.done) : t.done !== true
    )
    setActiveTaskId(firstUndone ? firstUndone.id : tasks[0].id)
  }, [tasks, activeTaskId, setActiveTaskId])

  const activeTask = tasks.find(task => task.id === activeTaskId) ?? tasks[0]

  const updateTask = async (id: string, updates: Partial<Task>) => {
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
    setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)))
    return data as Task
  }

  const addTask = async (task: NewTask) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert({ ...task, child_id: selectedChildId })
      .select()
      .single()
    if (err) {
      console.error('Error adding task:', err)
      setError('Failed to add task. Please try again.')
      return
    }
    setError(null)
    setTasks((prev) => [...prev, data as Task])
  }

  const deleteTask = async (id: string) => {
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

  const markDone = async (id: string) => {
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

  const addChild = async (name: string, avatar: string) => {
    const cleanName = name.trim()
    if (cleanName.length < 1 || cleanName.length > 40) {
      setError('A name must be 1 to 40 characters.')
      return false
    }
    const { data, error: err } = await supabase
      .from('children')
      .insert({ name: cleanName, avatar })
      .select()
      .single()
    if (err) {
      console.error('Error adding child:', err)
      setError('Failed to add the child. Please try again.')
      return false
    }
    setError(null)
    setChildProfiles((prev) => [...prev, data as Child])
    // The first child profile becomes the one that is shown.
    setSelectedChildId((current) => current ?? (data as Child).id)
    return true
  }

  const renameChild = async (id: string, name: string) => {
    const cleanName = name.trim()
    if (cleanName.length < 1 || cleanName.length > 40) {
      setError('A name must be 1 to 40 characters.')
      return false
    }
    const { data, error: err } = await supabase
      .from('children')
      .update({ name: cleanName })
      .eq('id', id)
      .select()
      .single()
    if (err) {
      console.error('Error renaming child:', err)
      setError('Failed to rename the child. Please try again.')
      return false
    }
    setError(null)
    setChildProfiles((prev) => prev.map((c) => (c.id === id ? (data as Child) : c)))
    return true
  }

  const deleteChild = async (id: string) => {
    const { error: err } = await supabase.from('children').delete().eq('id', id)
    if (err) {
      console.error('Error deleting child:', err)
      setError('Failed to delete the child. Please try again.')
      return false
    }
    setError(null)
    const remaining = childProfiles.filter((c) => c.id !== id)
    setChildProfiles(remaining)
    setSelectedChildId((current) => (current === id ? (remaining[0]?.id ?? null) : current))
    return true
  }

  const value = { children: childProfiles, selectedChildId, setSelectedChildId, addChild, renameChild, deleteChild, tasks, setTasks, activeTask, loading, error, addTask, updateTask, deleteTask, markDone }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider")
  return ctx
}
