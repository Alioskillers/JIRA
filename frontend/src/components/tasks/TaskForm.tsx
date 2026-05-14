'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { useTaskStore } from '@/store/taskStore';
import { useTeamStore } from '@/store/teamStore';
import { User } from '@/types';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  deadline: z.string().min(1, 'Deadline is required'),
  assigneeId: z.string().min(1, 'Assignee is required'),
  assigneeName: z.string().min(1),
  teamId: z.string().min(1, 'Team is required'),
  projectId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function TaskForm({ open, onOpenChange, onSuccess }: TaskFormProps) {
  const createTask = useTaskStore(s => s.createTask);
  const { teams, users, fetchTeams, fetchUsers } = useTeamStore();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  useEffect(() => {
    if (open) {
      fetchTeams();
      fetchUsers();
    }
  }, [open, fetchTeams, fetchUsers]);

  useEffect(() => {
    if (selectedTeamId) {
      setFilteredUsers(users.filter(u => u.teamId === selectedTeamId));
    }
  }, [selectedTeamId, users]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (imageFile) formData.append('image', imageFile);

      await createTask(formData);
      toast.success('Task created successfully');
      reset();
      setImageFile(null);
      setSelectedTeamId('');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm transition-colors';
  const labelClass = 'block text-sm font-medium text-zinc-300 mb-1.5';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-zinc-900 border-zinc-800 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-zinc-50">Create Task</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div>
            <label className={labelClass}>Title *</label>
            <input {...register('title')} className={inputClass} placeholder="Task title" />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea {...register('description')} rows={3} className={inputClass + ' resize-none'} placeholder="Task description" />
          </div>

          <div>
            <label className={labelClass}>Team *</label>
            <select
              className={inputClass}
              onChange={e => {
                setSelectedTeamId(e.target.value);
                setValue('teamId', e.target.value);
                setValue('assigneeId', '');
                setValue('assigneeName', '');
              }}
            >
              <option value="">Select team</option>
              {teams.map(t => (
                <option key={t.teamId} value={t.teamId}>{t.name}</option>
              ))}
            </select>
            <input type="hidden" {...register('teamId')} />
            {errors.teamId && <p className="mt-1 text-xs text-red-400">{errors.teamId.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Assignee *</label>
            <select
              className={inputClass}
              disabled={!selectedTeamId}
              onChange={e => {
                const u = filteredUsers.find(u => u.userId === e.target.value);
                if (u) {
                  setValue('assigneeId', u.userId);
                  setValue('assigneeName', u.name);
                }
              }}
            >
              <option value="">Select assignee</option>
              {filteredUsers.map(u => (
                <option key={u.userId} value={u.userId}>{u.name}</option>
              ))}
            </select>
            <input type="hidden" {...register('assigneeId')} />
            <input type="hidden" {...register('assigneeName')} />
            {errors.assigneeId && <p className="mt-1 text-xs text-red-400">Please select an assignee</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Priority</label>
              <select {...register('priority')} className={inputClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Deadline *</label>
              <input {...register('deadline')} type="date" className={inputClass} />
              {errors.deadline && <p className="mt-1 text-xs text-red-400">{errors.deadline.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Image Attachment</label>
            <ImageUpload onFileSelect={setImageFile} onClear={() => setImageFile(null)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 px-4 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
