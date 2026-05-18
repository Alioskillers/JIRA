'use client';

import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, loading, refetch, deleteProject } = useProjects();
  const user = useAuthStore(s => s.user);
  const [showForm, setShowForm] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{projects.length} projects</p>
        {user?.role === 'manager' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No projects yet" description="Create your first project to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.projectId}
              project={project}
              onClick={() => router.push(`/projects/${project.projectId}`)}
              onDelete={user?.role === 'manager' ? deleteProject : undefined}
            />
          ))}
        </div>
      )}

      <ProjectForm open={showForm} onOpenChange={setShowForm} onSuccess={refetch} />
    </div>
  );
}
