'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';

export function useTasks() {
  const { tasks, loading, fetchTasks, createTask, updateTaskStatus, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, createTask, updateTaskStatus, updateTask, deleteTask, refetch: fetchTasks };
}
