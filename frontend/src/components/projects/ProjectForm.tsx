'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTeamStore } from '@/store/teamStore';
import api from '@/lib/api';

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  teamId: z.string().min(1, 'Team is required'),
});

type FormData = z.infer<typeof schema>;

export function ProjectForm({ open, onOpenChange, onSuccess }: ProjectFormProps) {
  const { teams, fetchTeams } = useTeamStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) fetchTeams();
  }, [open, fetchTeams]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/projects', data);
      toast.success('Project created');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm transition-colors';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">New Project</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a new project and assign it to a team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name *</label>
            <input {...register('name')} className={inputClass} placeholder="Project name" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className={inputClass + ' resize-none'} placeholder="Project description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Team *</label>
            <select {...register('teamId')} className={inputClass}>
              <option value="">Select team</option>
              {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
            </select>
            {errors.teamId && <p className="mt-1 text-xs text-red-400">{errors.teamId.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
