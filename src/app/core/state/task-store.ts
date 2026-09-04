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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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
        (t) => t.status === TaskStatus.Done && !!t.completedAt && isSameDay(new Date(t.completedAt), now),
      ).length,
      inProgressToday: tasks.filter(
        (t) => t.status === TaskStatus.InProgress && isSameDay(new Date(t.updatedAt), now),
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
      });
    });
  }

  /** Only assign `completedAt` when the status is actually transitioning across the Done boundary. */
  private resolveCompletedAt(current: Task, newStatus: TaskStatus): string | null | undefined {
    if (newStatus === TaskStatus.Done && current.status !== TaskStatus.Done) {
      return new Date().toISOString();
    }
    if (newStatus !== TaskStatus.Done && current.status === TaskStatus.Done) {
      return null;
    }
    return undefined;
  }

  updateTask(id: string, dto: UpdateTaskDto, activityType: ActivityType = 'updated') {
    const current = this.tasks().find((t) => t.id === id);
    const title = dto.title ?? current?.title ?? id;
    if (dto.status && current) {
      const completedAt = this.resolveCompletedAt(current, dto.status);
      if (completedAt !== undefined) {
        dto = { ...dto, completedAt };
      }
    }
    return this.taskApi.update(id, dto).subscribe(() => {
      this.resource.reload();
      this.activityStore.record({
        type: activityType,
        taskId: id,
        message:
          activityType === 'moved'
            ? `Moved task "${title}" to ${dto.status}`
            : `Updated task "${title}"`,
      });
    });
  }

  deleteTask(id: string) {
    const title = this.tasks().find((t) => t.id === id)?.title ?? id;
    return this.taskApi.delete(id).subscribe(() => {
      this.resource.reload();
      this.activityStore.record({
        type: 'deleted',
        taskId: id,
        message: `Deleted task "${title}"`,
      });
    });
  }

  /** Moves a task to `newStatus` at `newIndex`, reindexing `order` for every task shifted in the source/target columns. */
  async moveTask(task: Task, newStatus: TaskStatus, newIndex: number): Promise<void> {
    const columns: Record<TaskStatus, Task[]> = this.tasksByStatus();
    const sameColumn: boolean = task.status === newStatus;

    const targetTasks = columns[newStatus].filter((t) => t.id !== task.id);
    targetTasks.splice(newIndex, 0, task);

    const updates: { id: string; dto: UpdateTaskDto }[] = [];
    const completedAt = this.resolveCompletedAt(task, newStatus);
    targetTasks.forEach((t, index) => {
      if (t.order !== index || t.status !== newStatus) {
        const dto: UpdateTaskDto = t.id === task.id ? { order: index, status: newStatus } : { order: index };
        if (t.id === task.id && completedAt !== undefined) {
          dto.completedAt = completedAt;
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

    await Promise.all(updates.map((update) => firstValueFrom(this.taskApi.update(update.id, update.dto))));
    this.resource.reload();
    this.activityStore.record({
      type: 'moved',
      taskId: task.id,
      message: `Moved task "${task.title}" to ${newStatus}`,
    });
  }

  reload() {
    this.resource.reload();
  }
}
