'use client';

import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { Task } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatDate, isOverdue, getInitials, cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  dragging?: boolean;
}

export function TaskCard({ task, onClick, dragging }: TaskCardProps) {
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all duration-200 shadow-sm overflow-hidden',
        dragging && 'shadow-2xl opacity-90 rotate-1 scale-105',
      )}
    >
      {/* Image thumbnail */}
      {task.imageUrl && (
        <div className="w-full h-32 overflow-hidden border-b border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2 flex-1">{task.title}</h3>
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={task.status} />
          {task.imageUrl && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Paperclip className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-sky-600/30 border border-sky-500/30 flex items-center justify-center">
              <span className="text-[10px] font-medium text-sky-300">{getInitials(task.assigneeName)}</span>
            </div>
            <span className="text-xs text-zinc-400 truncate max-w-[80px]">{task.assigneeName}</span>
          </div>

          <div className="flex items-center gap-3">
            {task.deadline && (
              <div className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-400' : 'text-zinc-500')}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.deadline)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <MessageSquare className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
