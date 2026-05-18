'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useTeamStore } from '@/store/teamStore';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

export default function TeamPage() {
  const { users, fetchUsers } = useTeamStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, [fetchUsers]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">{users.length} team members</p>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Invite users to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user: User) => (
            <div key={user.userId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">{getInitials(user.name)}</span>
              </div>
              <div>
                <p className="font-medium text-zinc-100">{user.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                  user.role === 'manager' ? 'bg-sky-500/15 text-sky-400' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {user.role}
                </span>
                {user.teamId && (
                  <span className="text-xs rounded-full px-2.5 py-0.5 font-medium bg-blue-500/10 text-blue-400">
                    {user.teamId.slice(0, 8)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
