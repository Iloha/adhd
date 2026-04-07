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
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <button onClick={() => setScreen('tasks')}>--</button>
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