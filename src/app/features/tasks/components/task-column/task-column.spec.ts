import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import { Task, TaskStatus } from '../../../../core/models';
import { TaskColumn } from './task-column';

describe('TaskColumn', () => {
  function create() {
    const fixture = TestBed.createComponent(TaskColumn);
    fixture.componentRef.setInput('status', TaskStatus.Todo);
    fixture.componentRef.setInput('title', 'To Do');
    fixture.componentRef.setInput('tasks', []);
    fixture.detectChanges();
    return fixture;
  }

  it('defaults connectedTo to an empty array', () => {
    const fixture = create();
    expect(fixture.componentInstance.connectedTo()).toEqual([]);
  });

  it('onDrop() forwards the drag event and its own status', () => {
    const fixture = create();
    const spy = vi.fn();
    fixture.componentInstance.dropped.subscribe(spy);

    const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<Task[]>;
    fixture.componentInstance.onDrop(event);

    expect(spy).toHaveBeenCalledWith({ event, status: TaskStatus.Todo });
  });
});
