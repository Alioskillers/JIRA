'use client';

import React from 'react';
import { CheckSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDate, isOverdue } from '@/lib/utils';
import { Task } from '@/types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { tasks, loading } = useTasks();
  const user = useAuthStore(s => s.user);

  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'inprogress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => isOverdue(t.deadline, t.status)).length;
  const recentTasks = [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50 tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'}&nbsp;
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5">Here&apos;s what&apos;s happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={total} icon={CheckSquare} color="bg-sky-500/15 text-sky-400" />
        <StatCard label="In Progress" value={inProgress} icon={Clock} color="bg-blue-500/15 text-blue-400" />
        <StatCard label="Completed" value={done} icon={TrendingUp} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="Overdue" value={overdue} icon={AlertCircle} color="bg-red-500/15 text-red-400" />
      </div>

      {/* Recent Tasks */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-100">Recent Tasks</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {recentTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No tasks yet</p>
          ) : recentTasks.map((task: Task) => (
            <div key={task.taskId} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{task.title}</p>
                <p className="text-xs text-zinc-500">{task.assigneeName} · {formatDate(task.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
