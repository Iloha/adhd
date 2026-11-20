"use client"

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { createClient } from "../lib/supabase/client"
import { useApp } from "./AppContext"
import type { Child, NewTask, SaveResult, Task } from "../types"

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
  addTask: (task: NewTask) => Promise<SaveResult>
  updateTask: (id: string, updates: Partial<Task>) => Promise<SaveResult>
  /** Adds a fresh copy of a task (same text, hint and steps, nothing done) at the end of the list. The original is not changed. */
  duplicateTask: (id: string) => Promise<SaveResult>
  deleteTask: (id: string) => Promise<void>
  /** Saves a new order: `orderedIds` are this child's task ids, first to last. */
  reorderTasks: (orderedIds: string[]) => Promise<boolean>
  markDone: (id: string) => Promise<void>
}

const TasksContext = createContext<TasksContextValue | null>(null)

/** New tasks go to the end of the list. */
function nextPosition(tasks: Task[]) {
  return tasks.reduce((next, t) => Math.max(next, (t.position ?? -1) + 1), tasks.length)
}

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
      ).order('position', { ascending: true }).order('created_at', { ascending: true })
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

  // Archived tasks are never the active task: child mode must not play them.
  const openTasks = tasks.filter((t) => !t.archived)

  useEffect(() => {
    const openTasks = tasks.filter((t) => !t.archived)
    if (activeTaskId || openTasks.length === 0) return
    const firstUndone = openTasks.find(t =>
      t.subtasks && t.subtasks.length > 0 ? !t.subtasks.every(s => s.done) : t.done !== true
    )
    setActiveTaskId(firstUndone ? firstUndone.id : openTasks[0].id)
  }, [tasks, activeTaskId, setActiveTaskId])

  const activeTask = openTasks.find(task => task.id === activeTaskId) ?? openTasks[0]

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (err) {
      console.error('Error updating task:', err)
      const message = 'Failed to update task. Please try again.'
      setError(message)
      return { ok: false as const, error: message }
    }
    setError(null)
    setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)))
    // An archived task cannot stay the active one: let the first unfinished open task be picked.
    if ((data as Task).archived && id === activeTaskId) setActiveTaskId(null)
    return { ok: true as const, task: data as Task }
  }

  const addTask = async (task: NewTask) => {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert({ ...task, child_id: selectedChildId, position: nextPosition(tasks) })
      .select()
      .single()
    if (err) {
      console.error('Error adding task:', err)
      const message = 'Failed to add task. Please try again.'
      setError(message)
      return { ok: false as const, error: message }
    }
    setError(null)
    setTasks((prev) => [...prev, data as Task])
    return { ok: true as const, task: data as Task }
  }

  const duplicateTask = async (id: string): Promise<SaveResult> => {
    const original = tasks.find((t) => t.id === id)
    if (!original) {
      const message = 'Failed to copy task. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
    // Only content is copied. id, created_at and user_id come from the database defaults.
    const copy = {
      text: original.text,
      hint: original.hint,
      done: false,
      child_id: original.child_id ?? null,
      subtasks: (original.subtasks ?? []).map(({ title, hint, subtask_hint, minutes, emoji }) => ({
        title,
        hint: hint ?? subtask_hint,
        minutes,
        emoji,
        done: false,
      })),
      position: nextPosition(tasks),
    }
    const { data, error: err } = await supabase
      .from('tasks')
      .insert(copy)
      .select()
      .single()
    if (err) {
      console.error('Error copying task:', err)
      const message = 'Failed to copy task. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
    setError(null)
    setTasks((prev) => [...prev, data as Task])
    // Forget the active task so child mode starts on the first unfinished task in the saved order,
    // not on a done one (the original) whose "Great job" screen would hide the copy.
    setActiveTaskId(null)
    return { ok: true, task: data as Task }
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

  const reorderTasks = async (orderedIds: string[]) => {
    const previous = tasks
    const byId = new Map(tasks.map((t) => [t.id, t]))
    // The ids are the tasks in the visible list; archived tasks keep their place at the end.
    const open = orderedIds.flatMap((id) => {
      const task = byId.get(id)
      return task && !task.archived ? [task] : []
    })
    if (open.length !== orderedIds.length || open.length !== openTasks.length) return false
    const reordered = [...open, ...tasks.filter((t) => t.archived)].map((t, position) => ({ ...t, position }))
    // Show the new order straight away; undo it if saving fails.
    setTasks(reordered)
    // Forget the active task so the first unfinished one in the new order is picked.
    setActiveTaskId(null)
    const changed = reordered.filter((t) => t.position !== byId.get(t.id)?.position)
    // select('id') returns the rows that were really updated: row-level security can
    // reject an update without an error, which would otherwise look like a success.
    const results = await Promise.all(
      changed.map((t) => supabase.from('tasks').update({ position: t.position }).eq('id', t.id).select('id')),
    )
    const failed = results.find((r) => r.error || !r.data?.length)
    if (failed) {
      console.error('Error saving task order:', failed.error ?? 'no row was updated (blocked by row-level security?)')
      setTasks(previous)
      setActiveTaskId(null)
      setError('Failed to save the new order. Please try again.')
      return false
    }
    setError(null)
    return true
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

  const value = { children: childProfiles, selectedChildId, setSelectedChildId, addChild, renameChild, deleteChild, tasks, setTasks, activeTask, loading, error, addTask, updateTask, duplicateTask, deleteTask, reorderTasks, markDone }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider")
  return ctx
}
