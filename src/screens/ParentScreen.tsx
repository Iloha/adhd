"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import ErrorBanner from "../components/ErrorBanner"
import Toast from "../components/Toast"
import { signOut } from "../app/auth/actions"
import AddTask from '../components/AddTask'
import ArchivedTasks from "../components/ArchivedTasks"
import DoneSection from "../components/DoneSection"
import ChildSwitcher from "../components/ChildSwitcher"
import ManageChildren from "../components/ManageChildren"
import StartChildMode from "../components/StartChildMode"
import { useApp } from "../context/AppContext"
import { groupTasks } from "../lib/taskGroups"
import type { Child, NewTask, SaveResult, Task } from "../types"

export interface FamilyProps {
    children: Child[]
    selectedChildId: string | null
    onSelectChild: (id: string) => void
    onAddChild: (name: string, avatar: string) => Promise<boolean>
    onRenameChild: (id: string, name: string) => Promise<boolean>
    onDeleteChild: (id: string) => Promise<boolean>
}

/** How long "Task deleted" can be undone before the task is really deleted. */
const UNDO_MS = 5000

interface ToastState {
    id: number
    message: string
    undoable?: boolean
}

type Screen = 'tasks' | 'createTask' | 'children' | 'childMode'

interface ParentScreenProps {
    tasks: Task[]
    deleteTask: (id: string) => void
    markDone?: (id: string) => void
    reorderTasks?: (orderedIds: string[]) => void
    addTask: (task: NewTask) => Promise<SaveResult> | void
    updateTask: (id: string, updates: Partial<Task>) => Promise<SaveResult> | void
    error: string | null
    family?: FamilyProps
}

function ParentScreen ({ tasks, deleteTask, addTask, updateTask, reorderTasks, error, family}: ParentScreenProps) {
    const { setActiveTaskId } = useApp()
    const [screen, setScreen] = useState<Screen>('tasks')
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
    const [toast, setToast] = useState<ToastState | null>(null)
    const [highlightId, setHighlightId] = useState<string | null>(null)
    // Tasks the parent deleted but that can still be undone are hidden, not yet removed.
    const [hiddenIds, setHiddenIds] = useState<Task['id'][]>([])
    const pendingDelete = useRef<Task | null>(null)
    const toastCount = useRef(0)
    const deleteRef = useRef(deleteTask)
    useEffect(() => { deleteRef.current = deleteTask })

    // Deletes the task that is waiting for its undo time to run out, right now.
    const commitDelete = useCallback(() => {
        const task = pendingDelete.current
        if (!task) return
        pendingDelete.current = null
        // Keep it hidden until the delete has finished, so it does not flash back into the list.
        Promise.resolve(deleteRef.current(task.id)).finally(() =>
            setHiddenIds((ids) => ids.filter((id) => id !== task.id)))
    }, [])

    const showToast = useCallback((message: string, undoable = false) => {
        commitDelete() // a new message replaces the old one, so a pending delete cannot be undone any more
        setToast({ id: ++toastCount.current, message, undoable })
    }, [commitDelete])

    const dismissToast = useCallback(() => {
        commitDelete()
        setToast(null)
    }, [commitDelete])

    // Leaving the screen does not cancel a delete the parent asked for.
    useEffect(() => commitDelete, [commitDelete])

    const requestDelete = (id: Task['id']) => {
        const task = tasks.find((t) => t.id === id)
        if (!task) return
        showToast('Task deleted', true)
        pendingDelete.current = task
        setHiddenIds((ids) => [...ids, id])
    }

    const undoDelete = () => {
        const task = pendingDelete.current
        pendingDelete.current = null
        if (task) setHiddenIds((ids) => ids.filter((id) => id !== task.id))
        setToast(null)
    }

    const visibleTasks = tasks.filter((t) => !hiddenIds.includes(t.id) && !t.archived)
    const archivedTasks = tasks.filter((t) => !hiddenIds.includes(t.id) && t.archived)
    const { unfinished, done } = groupTasks(visibleTasks)

    const [movedIds, setMovedIds] = useState<string[]>([])
    const previousGroups = useRef<Map<string, boolean>>(new Map())

    // A task that was in the list before and is now in the other group has moved: let it slide in.
    // The key ("id:1" for done, "id:0" for unfinished) stands for the groups. Ids are compared as strings, as a bigint id column gives numbers.
    const groupKey = visibleTasks.map((t) => `${t.id}:${done.includes(t) ? 1 : 0}`).join(',')
    useEffect(() => {
        const now = new Map<string, boolean>()
        for (const entry of groupKey ? groupKey.split(',') : []) {
            const cut = entry.lastIndexOf(':')
            now.set(entry.slice(0, cut), entry.slice(cut + 1) === '1')
        }
        const before = previousGroups.current
        previousGroups.current = now
        const moved = [...now].filter(([id, isDone]) => before.has(id) && before.get(id) !== isDone).map(([id]) => id)
        if (moved.length > 0) setMovedIds(moved)
    }, [groupKey])

    useEffect(() => {
        if (movedIds.length === 0) return
        const timer = setTimeout(() => setMovedIds([]), 600)
        return () => clearTimeout(timer)
    }, [movedIds])

    // Only the unfinished tasks can be dragged; the saved order still needs every task, so the done ones keep their place at the end.
    const reorderUnfinished = reorderTasks && ((orderedIds: string[]) =>
        reorderTasks([...orderedIds, ...visibleTasks.filter((t) => done.includes(t)).map((t) => t.id)]))

    const setArchived = async (id: Task['id'], archived: boolean) => {
        const result = await updateTask(id, { archived })
        // A failed save shows its own error banner, so only confirm a save that worked.
        if (result && !result.ok) return
        showToast(archived ? '✓ Task archived' : '✓ Task restored')
    }

    // The highlight fades out by itself (CSS, 1.5 s); drop the flag once it is over.
    useEffect(() => {
        if (!highlightId) return
        const timer = setTimeout(() => setHighlightId(null), 1600)
        return () => clearTimeout(timer)
    }, [highlightId])

    const onSaved = ({ mode, name, id }: { mode: 'create' | 'edit'; name: string; id?: string }) => {
        showToast(mode === 'create' ? `✓ "${name.trim()}" added` : '✓ Changes saved')
        setHighlightId(id ?? null)
    }

    const familyChildren = family?.children ?? []

    const editTask = (id: string) => {
        setActiveTaskId(id)
        setFormMode('edit')
        setScreen('createTask')
    }
    return (
         <div className="min-h-screen bg-gray-50 pb-32">
            <Toast
                message={toast?.message ?? null}
                onDismiss={dismissToast}
                resetKey={toast?.id}
                durationMs={toast?.undoable ? UNDO_MS : undefined}
                action={toast?.undoable ? { label: 'Undo', onClick: undoDelete } : undefined}
            />
            { screen === 'tasks' && <div className="max-w-5xl mx-auto px-6 pt-8">
                <header className="bg-white px-6 py-6 rounded-md">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Today's Tasks</h2>
                            <p className="text-sm text-gray-500 mt-1">{visibleTasks.length} tasks • {done.length} completed</p>
                        </div>
                                <div className="flex items-center gap-3">
                                    <Button  variant="ghost"
                                        onClick={() => setScreen('childMode')}
                                        className="mx-0"
                                    >
                                       Child Mode
                                    </Button>
                                    <form action={signOut}>
                                        <Button variant="ghost" type="submit" className="mx-0">
                                            Sign out
                                        </Button>
                                    </form>
                                </div>
                    </div>
                </header>
                {family && (
                    <ChildSwitcher
                        children={familyChildren}
                        selectedChildId={family.selectedChildId}
                        onSelect={family.onSelectChild}
                        onManage={() => setScreen('children')}
                    />
                )}
                <ErrorBanner message={error} />
                <main className="mt-6">
                    {tasks && <Tasks tasks={unfinished} onDelete={requestDelete} onArchive={(id) => setArchived(id, true)} onEdit={editTask} onReorder={reorderUnfinished} highlightId={highlightId} movedIds={movedIds}/>}
                    <DoneSection count={done.length} childId={family?.selectedChildId ?? null}>
                        <Tasks tasks={done} onDelete={requestDelete} onArchive={(id) => setArchived(id, true)} onEdit={editTask} highlightId={highlightId} movedIds={movedIds}/>
                    </DoneSection>
                    <ArchivedTasks tasks={archivedTasks} onRestore={(id) => setArchived(id, false)} />
                </main>

                {/* Fixed Add Task CTA */}
                <div className="fixed left-0 right-0 bottom-6 flex justify-center">
                    <div className="w-full max-w-5xl px-6">
                        <Button
                            onClick={() => { setFormMode('create'); setScreen('createTask') }}
                            variant="secondary"
                            className="w-full text-lg py-4 rounded-2xl shadow-lg"
                        >
                            + Add Task
                        </Button>
                    </div>
                </div>

            </div> }
            { screen === 'createTask' && <div className="max-w-5xl mx-auto px-6 pt-8">
                <header className="bg-white px-6 py-6 rounded-md">
                <div className="flex items-center">
                    <div className="text-left flex items-center gap-4">
                        <button type="button" aria-label="Back to tasks" className="flex items-center justify-center min-w-12 min-h-12 -ml-3 rounded-lg hover:bg-gray-100" onClick={() => setScreen('tasks')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-700"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></button>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">New task</h2>
                    </div>
                </div>
                </header>
                    <AddTask onAdd={addTask} onUpdate={updateTask} mode={formMode} tasks={tasks} setScreen={setScreen} onSaved={onSaved}/>
                </div>}
            { screen === 'children' && family && <div className="max-w-5xl mx-auto px-6 pt-8">
                <header className="bg-white px-6 py-6 rounded-md">
                    <div className="text-left flex items-center gap-4">
                        <button type="button" aria-label="Back to tasks" className="flex items-center justify-center min-w-12 min-h-12 -ml-3 rounded-lg hover:bg-gray-100" onClick={() => setScreen('tasks')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-700"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></button>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Children</h2>
                    </div>
                </header>
                <ErrorBanner message={error} />
                <ManageChildren
                    children={family.children}
                    onAdd={family.onAddChild}
                    onRename={family.onRenameChild}
                    onDelete={family.onDeleteChild}
                />
            </div> }
            { screen === 'childMode' && <div className="max-w-5xl mx-auto px-6 pt-8">
                <header className="bg-white px-6 py-6 rounded-md">
                    <div className="text-left flex items-center gap-4">
                        <button type="button" aria-label="Back to tasks" className="flex items-center justify-center min-w-12 min-h-12 -ml-3 rounded-lg hover:bg-gray-100" onClick={() => setScreen('tasks')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-700"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></button>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Start child mode</h2>
                    </div>
                </header>
                <StartChildMode children={familyChildren} onManageChildren={() => setScreen('children')} />
            </div> }
        </div>
    ) 
    
}

export default ParentScreen