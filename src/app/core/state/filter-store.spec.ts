import { TestBed } from '@angular/core/testing';
import { TaskPriority, TaskStatus } from '../models';
import { FilterStore } from './filter-store';

describe('FilterStore', () => {
  let store: FilterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.runInInjectionContext(() => new FilterStore());
  });

  it('starts with the "all"/empty defaults', () => {
    expect(store.searchTerm()).toBe('');
    expect(store.status()).toBe('all');
    expect(store.priority()).toBe('all');
    expect(store.assigneeId()).toBe('all');
  });

  it('setSearchTerm updates the searchTerm signal', () => {
    store.setSearchTerm('bug');
    expect(store.searchTerm()).toBe('bug');
  });

  it('setStatus updates the status signal', () => {
    store.setStatus(TaskStatus.InProgress);
    expect(store.status()).toBe(TaskStatus.InProgress);
  });

  it('setPriority updates the priority signal', () => {
    store.setPriority(TaskPriority.High);
    expect(store.priority()).toBe(TaskPriority.High);
  });

  it('setAssignee updates the assigneeId signal', () => {
    store.setAssignee('user-42');
    expect(store.assigneeId()).toBe('user-42');
  });

  it('reset() restores every filter to its initial value', () => {
    store.setSearchTerm('bug');
    store.setStatus(TaskStatus.Done);
    store.setPriority(TaskPriority.Low);
    store.setAssignee('user-42');

    store.reset();

    expect(store.searchTerm()).toBe('');
    expect(store.status()).toBe('all');
    expect(store.priority()).toBe('all');
    expect(store.assigneeId()).toBe('all');
  });
});
