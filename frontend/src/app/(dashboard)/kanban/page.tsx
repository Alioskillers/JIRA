'use client';

import { useTasks } from '@/hooks/useTasks';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function KanbanPage() {
  const { tasks, loading } = useTasks();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-zinc-400">{tasks.length} tasks across all columns</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard tasks={tasks} />
      </div>
    </div>
  );
}
