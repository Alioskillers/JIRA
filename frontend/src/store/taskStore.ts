'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import { Task } from '@/types';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (data: FormData) => Promise<Task>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  updateTask: (taskId: string, data: FormData) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/tasks');
      set({ tasks: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (data: FormData) => {
    const res = await api.post('/tasks', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    set(state => ({ tasks: [res.data, ...state.tasks] }));
    return res.data;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const res = await api.put(`/tasks/${taskId}/status`, { status });
    set(state => ({
      tasks: state.tasks.map(t => t.taskId === taskId ? { ...t, ...res.data } : t),
    }));
  },

  updateTask: async (taskId: string, data: FormData) => {
    const res = await api.put(`/tasks/${taskId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    set(state => ({
      tasks: state.tasks.map(t => t.taskId === taskId ? { ...t, ...res.data } : t),
    }));
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    await api.delete(`/tasks/${taskId}`);
    set(state => ({ tasks: state.tasks.filter(t => t.taskId !== taskId) }));
  },
}));
