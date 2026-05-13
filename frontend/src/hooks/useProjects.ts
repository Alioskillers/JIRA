'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Project } from '@/types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load projects';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: Partial<Project>) => {
    const res = await api.post('/projects', data);
    setProjects(prev => [res.data, ...prev]);
    return res.data;
  };

  const deleteProject = async (projectId: string) => {
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p.projectId !== projectId));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return { projects, loading, error, createProject, deleteProject, refetch: fetchProjects };
}
