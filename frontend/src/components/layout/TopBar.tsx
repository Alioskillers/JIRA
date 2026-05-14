'use client';

import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/kanban': 'Kanban Board',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/team': 'Team',
  '/users': 'User Management',
};

export function TopBar() {
  const pathname = usePathname();
  const user = useAuthStore(s => s.user);

  const title = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ?? 'Mini Jira';

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-10">
      <h1 className="font-semibold text-zinc-100 tracking-tight flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="hidden sm:block">{user?.email}</span>
        </div>
      </div>
    </header>
  );
}
