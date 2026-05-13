'use client';

import { useState } from 'react';
import { FolderOpen, Calendar, Trash2 } from 'lucide-react';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete?.(project.projectId);
    setDeleting(false);
    setConfirming(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-700 transition-all duration-200 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-sky-600/15 rounded-lg flex-shrink-0">
          <FolderOpen className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-100 truncate">{project.name}</h3>
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium mt-1 inline-block ${
            project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {project.status}
          </span>
        </div>
        {onDelete && !confirming && (
          <button
            onClick={handleDeleteClick}
            className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex-shrink-0"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {confirming && (
        <div
          onClick={e => e.stopPropagation()}
          className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-xs text-red-400 font-medium mb-2">Delete this project?</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 py-1 text-xs font-medium bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-md transition-all"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-1 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {project.description && (
        <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{project.description}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-zinc-500">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(project.createdAt)}</span>
      </div>
    </div>
  );
}
