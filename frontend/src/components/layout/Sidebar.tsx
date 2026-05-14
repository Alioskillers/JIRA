'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Columns2, CheckSquare, FolderOpen, Users, UserCog, LogOut,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban Board', icon: Columns2 },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/team', label: 'Team', icon: Users },
];

const managerItems = [
  { href: '/users', label: 'User Management', icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const allItems = user?.role === 'manager' ? [...navItems, ...managerItems] : navItems;

  return (
    <aside className="w-60 flex-shrink-0 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-sky-800 flex items-center justify-center shadow-lg shadow-sky-900/50">
            <span className="text-xs font-bold text-white">MJ</span>
          </div>
          <span className="font-semibold text-zinc-50 tracking-tight">Mini Jira</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {allItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sky-600/15 text-sky-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-white">{user ? getInitials(user.name) : '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{user?.name}</p>
            <span className={cn(
              'text-xs rounded-full px-1.5 py-0.5 font-medium',
              user?.role === 'manager' ? 'bg-sky-500/15 text-sky-400' : 'bg-zinc-700 text-zinc-400',
            )}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
