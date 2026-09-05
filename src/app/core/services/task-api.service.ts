import { httpResource, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateTaskDto, Task, TaskPriority, TaskStatus, UpdateTaskDto } from '../models';

export interface TaskFilterParams {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assigneeId: string | 'all';
  searchTerm: string;
}

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tasksss`;

  /**
   * Builds the tasks list URL from active filter criteria.
   * Uses plain readable `field=value` params (json-server v1 default `eq`) when no search term is set.
   * `_where` overrides all other params in json-server v1, so once a search term is present every
   * active filter is folded into a single `_where` AND/OR tree to keep status/priority/assignee working.
   */
  /**
   * @param filters - Active filter criteria from `FilterStore`.
   * @returns The full tasks-list URL, with query params or a `_where` clause encoding the filters.
   */
  private buildTasksUrl(filters: TaskFilterParams): string {
    const searchTerm = filters.searchTerm.trim();

    if (!searchTerm) {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.priority !== 'all') params.set('priority', filters.priority);
      if (filters.assigneeId !== 'all') params.set('assignee.id', filters.assigneeId);

      const query = params.toString();
      return query ? `${this.baseUrl}?${query}` : this.baseUrl;
    }

    const conditions: unknown[] = [
      { or: [{ title: { contains: searchTerm } }, { description: { contains: searchTerm } }] },
    ];
    if (filters.status !== 'all') conditions.push({ status: { eq: filters.status } });
    if (filters.priority !== 'all') conditions.push({ priority: { eq: filters.priority } });
    if (filters.assigneeId !== 'all')
      conditions.push({ assignee: { id: { eq: filters.assigneeId } } });

    const where = conditions.length === 1 ? conditions[0] : { and: conditions };
    return `${this.baseUrl}?_where=${encodeURIComponent(JSON.stringify(where))}`;
  }

  /** Filter-aware resource; re-fetches whenever the signals read inside `filters()` change. */
  tasksResource(filters: () => TaskFilterParams) {
    return httpResource<Task[]>(() => this.buildTasksUrl(filters()), { defaultValue: [] });
  }

  create(dto: CreateTaskDto) {
    return this.http.post<Task>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
