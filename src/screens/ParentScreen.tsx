"use client"

import { useState } from "react"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import ErrorBanner from "../components/ErrorBanner"
import { signOut } from "../app/auth/actions"
import AddTask from '../components/AddTask'
import ChildSwitcher from "../components/ChildSwitcher"
import ManageChildren from "../components/ManageChildren"
import StartChildMode from "../components/StartChildMode"
import { useApp } from "../context/AppContext"
import type { Child, NewTask, Task } from "../types"

export interface FamilyProps {
    children: Child[]
    selectedChildId: string | null
    onSelectChild: (id: string) => void
    onAddChild: (name: string, avatar: string) => Promise<boolean>
    onRenameChild: (id: string, name: string) => Promise<boolean>
    onDeleteChild: (id: string) => Promise<boolean>
}

type Screen = 'tasks' | 'createTask' | 'children' | 'childMode'

interface ParentScreenProps {
    tasks: Task[]
    deleteTask: (id: string) => void
    markDone?: (id: string) => void
    addTask: (task: NewTask) => void
    updateTask: (id: string, updates: Partial<Task>) => void
    error: string | null
    family?: FamilyProps
}

function ParentScreen ({ tasks, deleteTask, addTask, updateTask, error, family}: ParentScreenProps) {
    const { setActiveTaskId } = useApp()
    const [screen, setScreen] = useState<Screen>('tasks')
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

    const familyChildren = family?.children ?? []

    const editTask = (id: string) => {
        setActiveTaskId(id)
        setFormMode('edit')
        setScreen('createTask')
    }
    return (
         <div className="min-h-screen bg-gray-50 pb-32">
            { screen === 'tasks' && <div className="max-w-5xl mx-auto px-6 pt-8">
                <header className="bg-white px-6 py-6 rounded-md">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Today's Tasks</h2>
                            <p className="text-sm text-gray-500 mt-1">{tasks?.length ?? 0} tasks • {tasks ? tasks.filter(t => t.done).length : 0} completed</p>
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
                    {tasks && <Tasks tasks={tasks} onDelete={deleteTask} onEdit={editTask}/>}
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
                    <AddTask onAdd={addTask} onUpdate={updateTask} mode={formMode} tasks={tasks} setScreen={setScreen}/>
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