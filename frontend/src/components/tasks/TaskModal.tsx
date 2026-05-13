'use client';

import { useState } from 'react';
import { X, Calendar, User } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { CommentThread } from '@/components/comments/CommentThread';
import { formatDate, isOverdue, cn } from '@/lib/utils';
import { useTaskStore } from '@/store/taskStore';
import toast from 'react-hot-toast';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

export function TaskModal({ task, onClose }: TaskModalProps) {
  const updateTaskStatus = useTaskStore(s => s.updateTaskStatus);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === status) return;
    setSaving(true);
    try {
      await updateTaskStatus(task.taskId, newStatus);
      setStatus(newStatus);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 p-6 border-b border-zinc-800">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-50">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6">
            {/* Status Update */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={saving}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                      status === opt.value
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Description</label>
                <p className="text-sm text-zinc-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Image */}
            {task.imageUrl && (
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Attachment</label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={task.imageUrl} alt="Task attachment" className="rounded-lg border border-zinc-800 max-h-48 object-cover" />
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Assignee</p>
                  <p className="text-sm text-zinc-300">{task.assigneeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Deadline</p>
                  <p className={cn('text-sm', isOverdue(task.deadline, task.status) ? 'text-red-400' : 'text-zinc-300')}>
                    {formatDate(task.deadline)}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Log */}
            {task.auditLog && task.auditLog.length > 0 && (
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 block">Activity</label>
                <div className="space-y-2">
                  {task.auditLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-zinc-300 font-medium">{entry.userName}</span>
                        <span className="text-zinc-500"> changed status from </span>
                        <span className="text-zinc-300">{entry.fromStatus}</span>
                        <span className="text-zinc-500"> to </span>
                        <span className="text-zinc-300">{entry.toStatus}</span>
                        <span className="text-zinc-600 ml-2">{formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentThread taskId={task.taskId} />
          </div>
        </div>
      </div>
    </div>
  );
}
