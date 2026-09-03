import { httpResource } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateTaskDto, Task, UpdateTaskDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tasks`;

  /** Reactive resource backing the task list; call `reload()` after mutations. */
  readonly tasksResource = httpResource<Task[]>(() => this.baseUrl, {
    defaultValue: [],
  });

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
