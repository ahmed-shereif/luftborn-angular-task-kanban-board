import { computed, inject, Injectable } from '@angular/core';
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

  private readonly resource = this.taskApi.tasksResource;

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

  readonly filteredTasks = computed(() => {
    const searchTerm = this.filterStore.searchTerm().trim().toLowerCase();
    const status = this.filterStore.status();
    const priority = this.filterStore.priority();
    const assigneeId = this.filterStore.assigneeId();

    return this.tasks().filter((task) => {
      if (status !== 'all' && task.status !== status) return false;
      if (priority !== 'all' && task.priority !== priority) return false;
      if (assigneeId !== 'all' && task.assignee.id !== assigneeId) return false;
      if (
        searchTerm &&
        !task.title.toLowerCase().includes(searchTerm) &&
        !task.description.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }
      return true;
    });
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

  addTask(dto: CreateTaskDto) {
    return this.taskApi.create(dto).subscribe((created) => {
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

  moveTask(task: Task, status: TaskStatus) {
    return this.updateTask(task.id, { status }, 'moved');
  }

  reload() {
    this.resource.reload();
  }
}
