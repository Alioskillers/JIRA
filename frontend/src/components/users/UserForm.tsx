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

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['manager', 'employee']),
  teamId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function UserForm({ open, onOpenChange, onSuccess }: UserFormProps) {
  const { teams, fetchTeams } = useTeamStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  });

  useEffect(() => {
    if (open) fetchTeams();
  }, [open, fetchTeams]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/users', data);
      toast.success('User created successfully');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string | string[] } } };
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 403) {
        toast.error('Only managers can invite users. Make sure your account has the manager role set in Cognito.');
      } else if (status === 401) {
        toast.error('Session expired. Please sign in again.');
      } else {
        toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to create user'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm transition-colors';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Invite User</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a new user account. They will be assigned the employee role by default.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name *</label>
            <input {...register('name')} className={inputClass} placeholder="John Doe" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email *</label>
            <input {...register('email')} type="email" className={inputClass} placeholder="user@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Temporary Password *</label>
            <input {...register('password')} type="password" className={inputClass} placeholder="••••••••" />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Role</label>
              <select {...register('role')} className={inputClass}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Team</label>
              <select {...register('teamId')} className={inputClass}>
                <option value="">No team</option>
                {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Invite
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
