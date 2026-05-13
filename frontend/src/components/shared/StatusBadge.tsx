import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-zinc-800 text-zinc-300' },
  inprogress: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  inreview: { label: 'In Review', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  done: { label: 'Done', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status] ?? statusConfig.todo;
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
