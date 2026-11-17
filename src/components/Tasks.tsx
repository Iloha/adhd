import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Task from "./Task"

import type { Task as TaskType } from '../types'

interface TasksProps {
  tasks: TaskType[]
  onDelete?: (id: string) => void
  onEdit: (id: string) => void
  /** When set, tasks get a drag handle (mouse, touch and keyboard) and this gets the new id order. */
  onReorder?: (orderedIds: string[]) => void
  highlightId?: string | null
}

type TaskItemProps = Omit<React.ComponentProps<typeof Task>, 'sortable'>

function SortableTask(props: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id })
  return (
    <Task
      {...props}
      sortable={{
        setNodeRef,
        style: { transform: CSS.Transform.toString(transform), transition },
        handleProps: { ...attributes, ...listeners },
        isDragging,
      }}
    />
  )
}

function Tasks( {tasks, onDelete, onEdit, onReorder, highlightId = null}: TasksProps ) {
  const sensors = useSensors(
    // A small distance keeps a plain tap on the handle from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const ids = tasks.map((t) => t.id)
    // Compare as strings: a bigint id column gives numeric ids, and dnd-kit hands back the id it was given.
    const indexOfId = (id: string | number) => ids.findIndex((taskId) => String(taskId) === String(id))
    const from = indexOfId(active.id)
    const to = indexOfId(over.id)
    if (from < 0 || to < 0) return
    onReorder?.(arrayMove(ids, from, to))
  }

  const taskName = (id: string | number) => tasks.find((t) => t.id === id)?.text ?? 'task'
  const announcements = {
    onDragStart: ({ active }: { active: { id: string | number } }) => `Picked up ${taskName(active.id)}.`,
    onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      over ? `${taskName(active.id)} is over position ${tasks.findIndex((t) => t.id === over.id) + 1} of ${tasks.length}.` : undefined,
    onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      over ? `Moved ${taskName(active.id)} to position ${tasks.findIndex((t) => t.id === over.id) + 1} of ${tasks.length}.` : `${taskName(active.id)} was dropped.`,
    onDragCancel: ({ active }: { active: { id: string | number } }) => `Cancelled. ${taskName(active.id)} stays where it was.`,
  }

  // One task has nothing to reorder against, so it gets no handle.
  const sortable = Boolean(onReorder) && tasks.length > 1

  const items = tasks.map((task) =>
    sortable
      ? <SortableTask task={task} key={task.id} onDelete={onDelete} onEdit={onEdit} highlighted={task.id === highlightId} />
      : <Task task={task} key={task.id} onDelete={onDelete} onEdit={onEdit} highlighted={task.id === highlightId} />,
  )

  const list = (
    <ul className="px-6 py-6 space-y-4 text-left">
      {sortable ? <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>{items}</SortableContext> : items}
    </ul>
  )

  return (
    <div className="">
      {sortable ? (
        // DndContext adds helper <div>s, so it wraps the <ul> instead of sitting inside it.
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} accessibility={{ announcements }}>
          {list}
        </DndContext>
      ) : list}
    </div>
  )
}

export default Tasks
