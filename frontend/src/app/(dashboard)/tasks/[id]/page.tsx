'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Task } from '@/types';
import { TaskModal } from '@/components/tasks/TaskModal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(res => setTask(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!task) return <p className="text-zinc-400">Task not found</p>;

  return (
    <div>
      <TaskModal task={task} onClose={() => window.history.back()} />
    </div>
  );
}
