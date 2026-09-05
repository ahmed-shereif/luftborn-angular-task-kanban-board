import { Task, TaskStatus } from '../../core/models';

export type TaskDueVariant = 'overdue' | 'completed' | 'upcoming';

export interface TaskDueStatus {
  variant: TaskDueVariant;
  icon: string;
  label: string;
}

/**
 * Counts whole calendar days between two dates, truncating both to midnight first so the
 * result is a day-boundary diff (e.g. 11pm to 1am next day counts as 1 day, not 0).
 *
 * @param from - Start date.
 * @param to - End date.
 * @returns Number of calendar days from `from` to `to` (negative if `to` is earlier).
 */
function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * Derives the icon/label to show for a task's due date, covering overdue, completed and upcoming states.
 * Done tasks are always reported relative to `completedAt` (falling back to `dueDate` if unset);
 * all other tasks are reported relative to `dueDate`, with a negative day-diff indicating overdue.
 *
 * @param task - The task to derive a due-status display for.
 * @returns The variant/icon/label to render for this task's due date.
 */
export function getTaskDueStatus(task: Task): TaskDueStatus {
  const now = new Date();

  if (task.status === TaskStatus.Done) {
    const completedDate = new Date(task.completedAt ?? task.dueDate);
    const diff = daysBetween(completedDate, now);

    let label: string;
    if (diff === 0) {
      label = 'Completed today';
    } else if (diff === 1) {
      label = 'Completed yesterday';
    } else {
      label = `Completed on ${completedDate.toLocaleDateString()}`;
    }

    return { variant: 'completed', icon: 'check_circle', label };
  }

  const dueDate = new Date(task.dueDate);
  const diff = daysBetween(now, dueDate);

  if (diff < 0) {
    const overdueDays = Math.abs(diff);
    const label = overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`;
    return { variant: 'overdue', icon: 'warning', label };
  }

  let label: string;
  if (diff === 0) {
    label = 'Due today';
  } else if (diff === 1) {
    label = 'Due in 1 day';
  } else {
    label = `Due in ${diff} days`;
  }

  return { variant: 'upcoming', icon: 'event', label };
}
