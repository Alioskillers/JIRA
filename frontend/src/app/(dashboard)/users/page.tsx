'use client';

import { useEffect, useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { UserTable } from '@/components/users/UserTable';
import { UserForm } from '@/components/users/UserForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { users, fetchUsers, fetchTeams } = useTeamStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'manager') {
      router.push('/dashboard');
      return;
    }
    Promise.all([fetchUsers(), fetchTeams()]).finally(() => setLoading(false));
  }, [user, router, fetchUsers, fetchTeams]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      await fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{users.length} users</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users" description="Invite users to your workspace" />
      ) : (
        <UserTable users={users} onDelete={setDeleteTarget} onRefresh={fetchUsers} isManager />
      )}

      <UserForm open={showForm} onOpenChange={setShowForm} onSuccess={fetchUsers} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete User"
        description="This will remove the user from Cognito and all records."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
