import { computed, inject, Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models';
import { TaskApiService } from '../services';
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

  addTask(dto: Parameters<TaskApiService['create']>[0]) {
    return this.taskApi.create(dto).subscribe(() => this.resource.reload());
  }

  updateTask(id: string, dto: Parameters<TaskApiService['update']>[1]) {
    return this.taskApi.update(id, dto).subscribe(() => this.resource.reload());
  }

  deleteTask(id: string) {
    return this.taskApi.delete(id).subscribe(() => this.resource.reload());
  }

  moveTask(task: Task, status: TaskStatus) {
    return this.updateTask(task.id, { status });
  }

  reload() {
    this.resource.reload();
  }
}
