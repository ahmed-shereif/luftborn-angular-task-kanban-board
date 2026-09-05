import { TestBed } from '@angular/core/testing';
import { Task, TaskPriority, TaskStatus } from '../../../../core/models';
import { TaskCard } from './task-card';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Task',
    description: '',
    status: TaskStatus.Todo,
    priority: TaskPriority.Medium,
    dueDate: new Date().toISOString(),
    assignee: { id: 'u1', name: 'Jane Doe', avatar: 'JD', email: 'jane@example.com' },
    tags: [],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('TaskCard', () => {
  function create(task: Task, readonlyMode = false) {
    const fixture = TestBed.createComponent(TaskCard);
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('readonlyMode', readonlyMode);
    fixture.detectChanges();
    return fixture;
  }

  it('is not overdue when status is Done, regardless of dueDate', () => {
    const task = makeTask({ status: TaskStatus.Done, dueDate: new Date(Date.now() - 1e9).toISOString() });
    const fixture = create(task);
    expect(fixture.componentInstance.isOverdue()).toBe(false);
  });

  it('is overdue when the isOverdue flag is set', () => {
    const task = makeTask({ isOverdue: true });
    const fixture = create(task);
    expect(fixture.componentInstance.isOverdue()).toBe(true);
  });

  it('falls back to comparing dueDate against now when isOverdue is unset', () => {
    const past = makeTask({ dueDate: new Date(Date.now() - 1e9).toISOString() });
    expect(create(past).componentInstance.isOverdue()).toBe(true);

    const future = makeTask({ dueDate: new Date(Date.now() + 1e9).toISOString() });
    expect(create(future).componentInstance.isOverdue()).toBe(false);
  });

  it('nextStatuses excludes the current status', () => {
    const fixture = create(makeTask({ status: TaskStatus.InProgress }));
    expect(fixture.componentInstance.nextStatuses()).toEqual([TaskStatus.Todo, TaskStatus.Done]);
  });

  it('onEdit()/onDelete() emit the current task', () => {
    const task = makeTask();
    const fixture = create(task);
    const editSpy = vi.fn();
    const deleteSpy = vi.fn();
    fixture.componentInstance.edit.subscribe(editSpy);
    fixture.componentInstance.delete.subscribe(deleteSpy);

    fixture.componentInstance.onEdit();
    fixture.componentInstance.onDelete();

    expect(editSpy).toHaveBeenCalledWith(task);
    expect(deleteSpy).toHaveBeenCalledWith(task);
  });

  it('onStatusChange() emits the task + new status', () => {
    const task = makeTask();
    const fixture = create(task);
    const spy = vi.fn();
    fixture.componentInstance.statusChange.subscribe(spy);

    fixture.componentInstance.onStatusChange(TaskStatus.Done);

    expect(spy).toHaveBeenCalledWith({ task, status: TaskStatus.Done });
  });
});
