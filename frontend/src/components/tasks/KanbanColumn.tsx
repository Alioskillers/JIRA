'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

function SortableTaskCard({ task, onTaskClick }: { task: Task; onTaskClick: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.taskId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={() => onTaskClick(task)} />
    </div>
  );
}

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const columnColors: Record<TaskStatus, string> = {
  todo: 'border-zinc-700',
  inprogress: 'border-blue-500/40',
  inreview: 'border-amber-500/40',
  done: 'border-emerald-500/40',
};

const columnHeaderColors: Record<TaskStatus, string> = {
  todo: 'text-zinc-400',
  inprogress: 'text-blue-400',
  inreview: 'text-amber-400',
  done: 'text-emerald-400',
};

const countColors: Record<TaskStatus, string> = {
  todo: 'bg-zinc-700 text-zinc-300',
  inprogress: 'bg-blue-500/20 text-blue-400',
  inreview: 'bg-amber-500/20 text-amber-400',
  done: 'bg-emerald-500/20 text-emerald-400',
};

export function KanbanColumn({ id, label, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 flex-shrink-0 rounded-xl border bg-zinc-900/50 transition-colors',
        columnColors[id],
        isOver && 'bg-zinc-800/50',
      )}
    >
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <h2 className={cn('text-sm font-semibold flex-1', columnHeaderColors[id])}>{label}</h2>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', countColors[id])}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.taskId)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2.5 min-h-[200px]">
          {tasks.map(task => (
            <SortableTaskCard key={task.taskId} task={task} onTaskClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
