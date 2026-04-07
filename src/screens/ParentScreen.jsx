import { useState } from "react"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import AddTask from '../components/AddTask'
import { useApp } from "../context/AppContext.jsx"

function ParentScreen ({ tasks, deleteTask, markDone, addTask, updateTask, error}) {
    const { mode, setMode, setActiveTaskId } = useApp()
    const [screen, setScreen] = useState('tasks')
    const [formMode, setFormMode] = useState('create')

    const handleModeChange = () => {
        setMode('child')
    }

    const editTask = (id) => {
        setActiveTaskId(id)
        setFormMode('edit')
        setScreen('createTask')
    }
    return (
         <div className="min-h-screen bg-gray-50 pb-32 parent-screen">
            { screen === 'tasks' && <div className="max-w-5xl mx-auto px-6 pt-8">
                <header className="parent-screen__header bg-white px-6 py-6 rounded-md">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <h2 className="text-3xl font-bold text-gray-900">Today's Tasks</h2>
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
                <header className="parent-screen__header bg-white px-6 py-6 rounded-md">
                <div className="flex items-center">
                    <div className="text-left flex items-center gap-4">
                        <button onClick={() => setScreen('tasks')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left w-6 h-6 text-gray-700" data-fg-d9fi5="79.6:79.10704:/src/app/components/TaskEdit.tsx:86:13:2570:47:e:ArrowLeft::::::EIC8"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg></button>
                        <h2 className="text-3xl font-bold text-gray-900">New task</h2>
                    </div>
                </div>
                </header>
                    <AddTask onAdd={addTask} onUpdate={updateTask} mode={formMode} tasks={tasks} setScreen={setScreen}/>
                </div>}
        </div>
    ) 
    
}

export default ParentScreen