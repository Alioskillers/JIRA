import { TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-zinc-800 text-zinc-400' },
  medium: { label: 'Medium', className: 'bg-blue-500/10 text-blue-400' },
  high: { label: 'High', className: 'bg-amber-500/10 text-amber-400' },
  critical: { label: 'Critical', className: 'bg-red-500/10 text-red-400' },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority] ?? priorityConfig.medium;
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
