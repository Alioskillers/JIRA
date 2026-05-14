import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300 mb-1">{title}</h3>
      {description && <p className="text-xs text-zinc-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}
