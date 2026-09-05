import { computed, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateTaskDto, Task, TaskStatus, UpdateTaskDto } from '../models';
import { TaskApiService } from '../services';
import { ActivityStore, ActivityType } from './activity-store';
import { FilterStore } from './filter-store';

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  addedThisWeek: number;
  completedToday: number;
  inProgressToday: number;
  overdueToday: number;
}

/**
 * Compares two dates by calendar day only, ignoring the time-of-day component.
 *
 * @param a - First date to compare.
 * @param b - Second date to compare.
 * @returns `true` when both dates fall on the same year/month/day.
 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Counts whole calendar days elapsed between an ISO date string and `now`.
 * Both dates are truncated to midnight first, so this is a day-boundary diff
 * rather than a 24h-multiple diff (e.g. 11pm yesterday to 1am today is 1 day).
 *
 * @param dateStr - ISO date string to measure from.
 * @param now - Reference date to measure up to.
 * @returns Number of calendar days between `dateStr` and `now`.
 */
function daysSince(dateStr: string, now: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const start = new Date(dateStr);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((nowDay.getTime() - startDay.getTime()) / MS_PER_DAY);
}

/** Central task state: fetch via httpResource, mutate via HttpClient, derive filtered/grouped views. */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly taskApi = inject(TaskApiService);
  private readonly filterStore = inject(FilterStore);
  private readonly activityStore = inject(ActivityStore);

  private readonly resource = this.taskApi.tasksResource(() => ({
    status: this.filterStore.status(),
    priority: this.filterStore.priority(),
    assigneeId: this.filterStore.assigneeId(),
    searchTerm: this.filterStore.searchTerm(),
  }));

  readonly tasks = computed(() => this.resource.value() ?? []);
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());

  readonly tasksByStatus = computed(() => {
    const tasks = this.tasks();
    return {
      [TaskStatus.Todo]: tasks.filter((t) => t.status === TaskStatus.Todo),
      [TaskStatus.InProgress]: tasks.filter((t) => t.status === TaskStatus.InProgress),
      [TaskStatus.Done]: tasks.filter((t) => t.status === TaskStatus.Done),
    };
  });

  /**
   * Aggregate counters for the Dashboard stat cards, all recomputed reactively from `tasks()`.
   * `*Today` fields double as "delta since last check" indicators by comparing each task's
   * relevant timestamp (`completedAt`, `movedToInProgressAt`, `dueDate`) against the current day.
   */
  readonly liveStats = computed<TaskStats>(() => {
    const tasks = this.tasks();
    const now = new Date();
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === TaskStatus.Done).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.InProgress).length,
      overdue: tasks.filter((t) => t.isOverdue).length,
      addedThisWeek: tasks.filter((t) => daysSince(t.createdAt, now) < 7).length,
      completedToday: tasks.filter(
        (t) =>
          t.status === TaskStatus.Done &&
          !!t.completedAt &&
          isSameDay(new Date(t.completedAt), now),
      ).length,
      inProgressToday: tasks.filter(
        (t) =>
          t.status === TaskStatus.InProgress &&
          !!t.movedToInProgressAt &&
          isSameDay(new Date(t.movedToInProgressAt), now),
      ).length,
      overdueToday: tasks.filter((t) => t.isOverdue && isSameDay(new Date(t.dueDate), now)).length,
    };
  });

  /** Appends the new task to the end of its target status column. */
  addTask(dto: Omit<CreateTaskDto, 'order'>) {
    const order = this.tasksByStatus()[dto.status].length;
    return this.taskApi.create({ ...dto, order }).subscribe((created) => {
      this.resource.reload();
      this.activityStore.record({
        type: 'created',
        taskId: created.id,
        message: `Created task "${created.title}"`,
        userId: created.assignee?.id,
        userName: created.assignee?.name,
        userAvatar: created.assignee?.avatar,
      });
    });
  }

  /**
   * Only assign `completedAt` when the status is actually transitioning across the Done boundary.
   *
   * @param current - The task's state before this update.
   * @param newStatus - The status being applied.
   * @returns A new ISO timestamp when entering Done, `null` when leaving Done (clears the field),
   *  or `undefined` when the Done boundary isn't crossed (leave `completedAt` untouched).
   */
  private resolveCompletedAt(current: Task, newStatus: TaskStatus): string | null | undefined {
    if (newStatus === TaskStatus.Done && current.status !== TaskStatus.Done) {
      return new Date().toISOString();
    }
    if (newStatus !== TaskStatus.Done && current.status === TaskStatus.Done) {
      return null;
    }
    return undefined;
  }

  /**
   * Only assign `movedToInProgressAt` when the status is actually transitioning across the In Progress boundary.
   *
   * @param current - The task's state before this update.
   * @param newStatus - The status being applied.
   * @returns A new ISO timestamp when entering In Progress, `null` when leaving it (clears the field),
   *  or `undefined` when that boundary isn't crossed (leave `movedToInProgressAt` untouched).
   */
  private resolveMovedToInProgressAt(
    current: Task,
    newStatus: TaskStatus,
  ): string | null | undefined {
    if (newStatus === TaskStatus.InProgress && current.status !== TaskStatus.InProgress) {
      return new Date().toISOString();
    }
    if (newStatus !== TaskStatus.InProgress && current.status === TaskStatus.InProgress) {
      return null;
    }
    return undefined;
  }

  updateTask(id: string, dto: UpdateTaskDto, activityType: ActivityType = 'updated') {
    const current = this.tasks().find((t) => t.id === id);
    const title = dto.title ?? current?.title ?? id;
    if (dto.status && current) {
      const newStatus = dto.status;
      const completedAt = this.resolveCompletedAt(current, newStatus);
      if (completedAt !== undefined) {
        dto = { ...dto, completedAt };
      }
      const movedToInProgressAt = this.resolveMovedToInProgressAt(current, newStatus);
      if (movedToInProgressAt !== undefined) {
        dto = { ...dto, movedToInProgressAt };
      }
    }
    return this.taskApi.update(id, dto).subscribe(() => {
      this.resource.reload();
      const assignee = current?.assignee;
      this.activityStore.record({
        type: activityType,
        taskId: id,
        message:
          activityType === 'moved'
            ? `Moved task "${title}" to ${dto.status}`
            : `Updated task "${title}"`,
        userId: assignee?.id,
        userName: assignee?.name,
        userAvatar: assignee?.avatar,
      });
    });
  }

  deleteTask(id: string) {
    const task = this.tasks().find((t) => t.id === id);
    const title = task?.title ?? id;
    return this.taskApi.delete(id).subscribe(() => {
      this.resource.reload();
      this.activityStore.record({
        type: 'deleted',
        taskId: id,
        message: `Deleted task "${title}"`,
        userId: task?.assignee?.id,
        userName: task?.assignee?.name,
        userAvatar: task?.assignee?.avatar,
      });
    });
  }

  /**
   * Moves a task to `newStatus` at `newIndex`, reindexing `order` for every task shifted in the
   * source/target columns so drag-and-drop reordering persists correctly (used for Kanban DnD).
   * Rebuilds the target column locally with the task spliced into place, diffs each task's new
   * `order`/`status` against its current value to build a minimal set of PATCH requests, does the
   * same for the vacated source column when moving across columns, then fires all patches in
   * parallel before reloading and logging a single activity entry.
   *
   * @param task - The task being moved.
   * @param newStatus - The column being moved to (same as `task.status` for in-column reorders).
   * @param newIndex - Zero-based position within the target column's task list.
   */
  async moveTask(task: Task, newStatus: TaskStatus, newIndex: number): Promise<void> {
    const columns: Record<TaskStatus, Task[]> = this.tasksByStatus();
    const sameColumn: boolean = task.status === newStatus;

    const targetTasks = columns[newStatus].filter((t) => t.id !== task.id);
    targetTasks.splice(newIndex, 0, task);

    const updates: { id: string; dto: UpdateTaskDto }[] = [];
    const completedAt = this.resolveCompletedAt(task, newStatus);
    const movedToInProgressAt = this.resolveMovedToInProgressAt(task, newStatus);
    targetTasks.forEach((t, index) => {
      if (t.order !== index || t.status !== newStatus) {
        const dto: UpdateTaskDto =
          t.id === task.id ? { order: index, status: newStatus } : { order: index };
        if (t.id === task.id && completedAt !== undefined) {
          dto.completedAt = completedAt;
        }
        if (t.id === task.id && movedToInProgressAt !== undefined) {
          dto.movedToInProgressAt = movedToInProgressAt;
        }
        updates.push({ id: t.id, dto });
      }
    });

    if (!sameColumn) {
      columns[task.status]
        .filter((t) => t.id !== task.id)
        .forEach((t, index) => {
          if (t.order !== index) {
            updates.push({ id: t.id, dto: { order: index } });
          }
        });
    }

    await Promise.all(
      updates.map((update) => firstValueFrom(this.taskApi.update(update.id, update.dto))),
    );
    this.resource.reload();
    this.activityStore.record({
      type: 'moved',
      taskId: task.id,
      message: `Moved task "${task.title}" to ${newStatus}`,
      userId: task.assignee?.id,
      userName: task.assignee?.name,
      userAvatar: task.assignee?.avatar,
    });
  }

  reload() {
    this.resource.reload();
  }
}
