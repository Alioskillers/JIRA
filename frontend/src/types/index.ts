export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'manager' | 'employee';
  teamId: string;
  createdAt?: string;
}

export interface Team {
  teamId: string;
  name: string;
  description?: string;
  createdAt: string;
  members?: User[];
}

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  teamId: string;
  status: 'active' | 'archived';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'inprogress' | 'inreview' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AuditEntry {
  action: string;
  userId: string;
  userName: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
}

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  assigneeId: string;
  assigneeName: string;
  teamId: string;
  projectId?: string;
  imageKey?: string | null;
  resizedImageKey?: string | null;
  imageVersions?: string[];
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  auditLog?: AuditEntry[];
}

export interface Comment {
  commentId: string;
  taskId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
}
