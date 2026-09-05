import { TestBed } from '@angular/core/testing';
import { TaskStatus } from '../../../../core/models';
import { TaskFilterBar } from './task-filter-bar';

describe('TaskFilterBar', () => {
  function create() {
    const fixture = TestBed.createComponent(TaskFilterBar);
    fixture.componentRef.setInput('status', 'all');
    fixture.componentRef.setInput('priority', 'all');
    fixture.detectChanges();
    return fixture;
  }

  it('exposes the 4 status tabs including "all"', () => {
    const fixture = create();
    expect(fixture.componentInstance.statusTabs.map((t) => t.value)).toEqual([
      'all',
      TaskStatus.Todo,
      TaskStatus.InProgress,
      TaskStatus.Done,
    ]);
  });

  it('exposes the 4 priority options including "all"', () => {
    const fixture = create();
    expect(fixture.componentInstance.priorityOptions.length).toBe(4);
    expect(fixture.componentInstance.priorityOptions[0]).toBe('all');
  });

  it('emits statusChange/priorityChange/newTask outputs', () => {
    const fixture = create();
    const statusSpy = vi.fn();
    const prioritySpy = vi.fn();
    const newTaskSpy = vi.fn();
    fixture.componentInstance.statusChange.subscribe(statusSpy);
    fixture.componentInstance.priorityChange.subscribe(prioritySpy);
    fixture.componentInstance.newTask.subscribe(newTaskSpy);

    fixture.componentInstance.statusChange.emit(TaskStatus.Done);
    fixture.componentInstance.priorityChange.emit('all');
    fixture.componentInstance.newTask.emit();

    expect(statusSpy).toHaveBeenCalledWith(TaskStatus.Done);
    expect(prioritySpy).toHaveBeenCalledWith('all');
    expect(newTaskSpy).toHaveBeenCalled();
  });
});
