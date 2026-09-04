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
  /** Timestamp of the most recent transition into the In Progress status. */
  movedToInProgressAt?: string;
  assignee: Assignee;
  tags: string[];
  /** Position within its status column, used to persist kanban drag-drop ordering. */
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskDto = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
/** `completedAt`/`movedToInProgressAt` additionally accept `null` here so moving a task off their target status can clear them server-side. */
export type UpdateTaskDto = Partial<Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'movedToInProgressAt'>> & {
  completedAt?: string | null;
  movedToInProgressAt?: string | null;
};
