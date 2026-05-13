'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Project, Task } from '@/types';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get('/tasks'),
    ])
      .then(([pRes, tRes]) => {
        setProject(pRes.data);
        setTasks((tRes.data as Task[]).filter((t: Task) => t.projectId === id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!project) return <p className="text-zinc-400">Project not found</p>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <Link href="/projects" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-50">{project.name}</h2>
            {project.description && <p className="text-sm text-zinc-400 mt-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
              project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {project.status}
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-1">{tasks.length} tasks · Created {formatDate(project.createdAt)}</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard tasks={tasks} />
      </div>
    </div>
  );
}
