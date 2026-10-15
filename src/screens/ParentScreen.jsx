"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import AddTask from '../components/AddTask'
import { useApp } from "../context/AppContext.jsx"

function ParentScreen ({ tasks, deleteTask, markDone, addTask, updateTask, error}) {
    const { setActiveTaskId } = useApp()
    const router = useRouter()
    const [screen, setScreen] = useState('tasks')
    const [formMode, setFormMode] = useState('create')

    const handleModeChange = () => {
        router.push('/child')
    }

    const editTask = (id) => {
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
                                <div>
                                    <Button  variant="ghost"
                                        onClick={handleModeChange}
                                        className="mx-0"
                                    >
                                       Child Mode
                                    </Button>
                                    
                                </div>
                    </div>
                </header>

                {error && (
                    <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        {error}
                    </div>
                )}
                <main className="mt-6">
                    {tasks && <Tasks tasks={tasks} onDelete={deleteTask} markDone={markDone} onEdit={editTask}/>}
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
        </div>
    ) 
    
}

export default ParentScreen