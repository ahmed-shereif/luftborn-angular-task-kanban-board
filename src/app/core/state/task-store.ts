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
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === TaskStatus.Done).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.InProgress).length,
      overdue: tasks.filter((t) => t.isOverdue).length,
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

  updateTask(id: string, dto: UpdateTaskDto, activityType: ActivityType = 'updated') {
    const title = dto.title ?? this.tasks().find((t) => t.id === id)?.title ?? id;
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
    targetTasks.forEach((t, index) => {
      if (t.order !== index || t.status !== newStatus) {
        updates.push({ id: t.id, dto: t.id === task.id ? { order: index, status: newStatus } : { order: index } });
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
