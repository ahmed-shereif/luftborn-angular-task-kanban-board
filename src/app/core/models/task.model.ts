export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
}

export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue?: boolean;
  completedAt?: string;
  assignee: Assignee;
  tags: string[];
  /** Position within its status column, used to persist kanban drag-drop ordering. */
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskDto = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
/** `completedAt` additionally accepts `null` here so moving a task off Done can clear it server-side. */
export type UpdateTaskDto = Partial<Omit<Task, 'id' | 'createdAt' | 'completedAt'>> & { completedAt?: string | null };
