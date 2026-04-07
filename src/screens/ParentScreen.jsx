import { useState } from "react"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import AddTask from '../components/AddTask'
import { useApp } from "../context/AppContext.jsx"

function ParentScreen ({ tasks, deleteTask, markDone, addTask, error}) {
    const { mode, setMode } = useApp()
    const [screen, setScreen] = useState('tasks')

    const handleModeChange = () => {
        setMode('child')
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
                    {tasks && <Tasks tasks={tasks} onDelete={deleteTask} markDone={markDone}/>}
                </main>

                {/* Fixed Add Task CTA */}
                <div className="fixed left-0 right-0 bottom-6 flex justify-center">
                    <div className="w-full max-w-5xl px-6">
                        <Button
                            onClick={() => setScreen('createTask')}
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
                        <h2 className="text-3xl font-bold text-gray-900">New task</h2>
                    </div>
                </div>
                </header>
                    <AddTask onAdd={addTask} />
                </div>}
        </div>
    ) 
    
}

export default ParentScreen