'use client';

import { Trash2 } from 'lucide-react';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';

interface UserTableProps {
  users: User[];
  onDelete?: (userId: string) => void;
  isManager?: boolean;
}

export function UserTable({ users, onDelete, isManager }: UserTableProps) {
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
              <td className="px-5 py-3 text-sm text-zinc-400">{user.teamId || '—'}</td>
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
