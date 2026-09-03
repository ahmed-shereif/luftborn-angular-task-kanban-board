import { Injectable, signal } from '@angular/core';
import { TaskPriority, TaskStatus } from '../models';

export interface FilterCriteria {
  searchTerm: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assigneeId: string | 'all';
}

const INITIAL_FILTERS: FilterCriteria = {
  searchTerm: '',
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
};

/** Pure UI filter state consumed by TaskStore's derived signals. */
@Injectable({ providedIn: 'root' })
export class FilterStore {
  readonly searchTerm = signal(INITIAL_FILTERS.searchTerm);
  readonly status = signal<FilterCriteria['status']>(INITIAL_FILTERS.status);
  readonly priority = signal<FilterCriteria['priority']>(INITIAL_FILTERS.priority);
  readonly assigneeId = signal<FilterCriteria['assigneeId']>(INITIAL_FILTERS.assigneeId);

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setStatus(value: FilterCriteria['status']): void {
    this.status.set(value);
  }

  setPriority(value: FilterCriteria['priority']): void {
    this.priority.set(value);
  }

  setAssignee(value: FilterCriteria['assigneeId']): void {
    this.assigneeId.set(value);
  }

  reset(): void {
    this.searchTerm.set(INITIAL_FILTERS.searchTerm);
    this.status.set(INITIAL_FILTERS.status);
    this.priority.set(INITIAL_FILTERS.priority);
    this.assigneeId.set(INITIAL_FILTERS.assigneeId);
  }
}
