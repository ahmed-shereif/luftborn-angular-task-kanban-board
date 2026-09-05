import { Task, TaskPriority, TaskStatus } from '../../core/models';
import { getTaskDueStatus } from './task-due-status.util';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Task',
    description: '',
    status: TaskStatus.Todo,
    priority: TaskPriority.Medium,
    dueDate: new Date().toISOString(),
    assignee: { id: 'u1', name: 'Jane', avatar: 'JD', email: 'jane@example.com' },
    tags: [],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

describe('getTaskDueStatus', () => {
  describe('Done tasks', () => {
    it('returns "Completed today" when completedAt is today', () => {
      const task = makeTask({ status: TaskStatus.Done, completedAt: new Date().toISOString() });
      const result = getTaskDueStatus(task);
      expect(result).toEqual({ variant: 'completed', icon: 'check_circle', label: 'Completed today' });
    });

    it('returns "Completed yesterday" when completedAt was yesterday', () => {
      const task = makeTask({ status: TaskStatus.Done, completedAt: daysFromNow(-1) });
      expect(getTaskDueStatus(task).label).toBe('Completed yesterday');
    });

    it('returns a formatted date for older completions', () => {
      const completedAt = daysFromNow(-10);
      const task = makeTask({ status: TaskStatus.Done, completedAt });
      const expectedDate = new Date(completedAt).toLocaleDateString();
      expect(getTaskDueStatus(task).label).toBe(`Completed on ${expectedDate}`);
    });

    it('falls back to dueDate when completedAt is missing', () => {
      const task = makeTask({ status: TaskStatus.Done, completedAt: undefined, dueDate: new Date().toISOString() });
      expect(getTaskDueStatus(task).label).toBe('Completed today');
    });
  });

  describe('non-Done tasks', () => {
    it('marks a task overdue by 1 day', () => {
      const task = makeTask({ status: TaskStatus.Todo, dueDate: daysFromNow(-1) });
      const result = getTaskDueStatus(task);
      expect(result).toEqual({ variant: 'overdue', icon: 'warning', label: 'Overdue by 1 day' });
    });

    it('marks a task overdue by multiple days', () => {
      const task = makeTask({ status: TaskStatus.InProgress, dueDate: daysFromNow(-5) });
      expect(getTaskDueStatus(task).label).toBe('Overdue by 5 days');
    });

    it('returns "Due today" for a task due today', () => {
      const task = makeTask({ status: TaskStatus.Todo, dueDate: new Date().toISOString() });
      const result = getTaskDueStatus(task);
      expect(result).toEqual({ variant: 'upcoming', icon: 'event', label: 'Due today' });
    });

    it('returns "Due in 1 day" for tomorrow', () => {
      const task = makeTask({ status: TaskStatus.Todo, dueDate: daysFromNow(1) });
      expect(getTaskDueStatus(task).label).toBe('Due in 1 day');
    });

    it('returns "Due in N days" for further-out due dates', () => {
      const task = makeTask({ status: TaskStatus.Todo, dueDate: daysFromNow(5) });
      expect(getTaskDueStatus(task).label).toBe('Due in 5 days');
    });
  });
});
