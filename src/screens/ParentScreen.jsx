import { useState } from "react"
import Tasks from "../components/Tasks"
import Button from "../components/Button"
import AddTask from '../components/AddTask'

function ParentScreen ({ tasks, deleteTask, markDone, addTask}) {
        const [showAddTask, setShowAddTask] = useState(false)

        return (
                <div className="min-h-screen bg-gray-50 pb-32 parent-screen">
                    <div className="max-w-5xl mx-auto px-6 pt-8">
                        <header className="parent-screen__header bg-white px-6 py-6 rounded-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Today's Tasks</h2>
                                    <p className="text-sm text-gray-500 mt-1">{tasks?.length ?? 0} tasks • {tasks ? tasks.filter(t => t.done).length : 0} completed</p>
                                </div>
                                <div>
                                    <button className="text-sm text-blue-600 hover:text-blue-700 px-4 py-2 rounded-full border border-blue-200 hover:border-blue-300 transition-colors">
                                        Child Mode
                                    </button>
                                </div>
                            </div>
                        </header>

                        <main className="mt-6">
                            {tasks && <Tasks tasks={tasks} onDelete={deleteTask} markDone={markDone}/>} 
                        </main>
                    </div>

                    {/* Fixed Add Task CTA */}
                    <div className="fixed left-0 right-0 bottom-6 flex justify-center">
                        <div className="w-full max-w-5xl px-6">
                            <Button
                                onClick={() => setShowAddTask(!showAddTask)}
                                variant="secondary"
                                className="w-full text-lg py-4 rounded-2xl shadow-lg"
                            >
                                + Add Task
                            </Button>
                        </div>
                    </div>

                    {showAddTask && <div className="fixed left-0 right-0 bottom-28 flex justify-center px-6">
                        <div className="w-full max-w-3xl"><AddTask onAdd={addTask} /></div>
                    </div>}
                </div>
        )
}

export default ParentScreen