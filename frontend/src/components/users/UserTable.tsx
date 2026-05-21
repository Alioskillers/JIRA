'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';
import { useTeamStore } from '@/store/teamStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface UserTableProps {
  users: User[];
  onDelete?: (userId: string) => void;
  onRefresh?: () => void;
  isManager?: boolean;
}

function TeamCell({ user, teams, onRefresh }: { user: User; teams: { teamId: string; name: string }[]; onRefresh?: () => void }) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (teamId: string) => {
    setSaving(true);
    try {
      await api.patch(`/users/${user.userId}`, { teamId: teamId || 'unassigned' });
      toast.success(`${user.name} assigned to ${teams.find(t => t.teamId === teamId)?.name ?? 'no team'}`);
      onRefresh?.();
    } catch {
      toast.error('Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500 flex-shrink-0" />}
      <select
        defaultValue={user.teamId === 'unassigned' ? '' : (user.teamId ?? '')}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-sky-500 disabled:opacity-50 transition-colors"
      >
        <option value="">No team</option>
        {teams.map(t => (
          <option key={t.teamId} value={t.teamId}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}

export function UserTable({ users, onDelete, onRefresh, isManager }: UserTableProps) {
  const { teams } = useTeamStore();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">User</th>
            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Email</th>
            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Role</th>
            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Team</th>
            {isManager && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map(user => (
            <tr key={user.userId} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">{getInitials(user.name)}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-200">{user.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-sm text-zinc-400">{user.email}</td>
              <td className="px-5 py-3">
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                  user.role === 'manager'
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-5 py-3">
                {isManager ? (
                  <TeamCell user={user} teams={teams} onRefresh={onRefresh} />
                ) : (
                  <span className="text-sm text-zinc-400">
                    {teams.find(t => t.teamId === user.teamId)?.name ?? (user.teamId === 'unassigned' ? '—' : user.teamId ?? '—')}
                  </span>
                )}
              </td>
              {isManager && (
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onDelete?.(user.userId)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
