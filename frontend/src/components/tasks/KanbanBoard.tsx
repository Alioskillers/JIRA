'use client';

import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core';
import { Task, TaskStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useTaskStore } from '@/store/taskStore';
import toast from 'react-hot-toast';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'inreview', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const updateTaskStatus = useTaskStore(s => s.updateTaskStatus);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tasksByStatus = (status: TaskStatus) =>
    localTasks.filter(t => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find(t => t.taskId === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = localTasks.find(t => t.taskId === taskId);
    if (!task) return;

    const newStatus = (COLUMNS.some(c => c.id === overId) ? overId : task.status) as TaskStatus;

    if (newStatus === task.status) return;

    const previous = localTasks.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t);
    setLocalTasks(previous);

    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`);
    } catch {
      setLocalTasks(tasks);
      toast.error('Failed to update status');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasksByStatus(col.id)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} dragging />}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
