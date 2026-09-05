import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Task, TaskPriority, TaskStatus } from '../../../core/models';
import { NotificationService } from '../../../core/services';
import { TaskStore } from '../../../core/state';
import { TaskListPage } from './task-list-page';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Task',
    description: '',
    status: TaskStatus.Todo,
    priority: TaskPriority.Medium,
    dueDate: new Date().toISOString(),
    assignee: { id: 'u1', name: 'Jane', avatar: 'JD', email: 'jane@example.com' },
    tags: [],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('TaskListPage', () => {
  let httpMock: HttpTestingController;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;
  let notificationSuccessSpy: ReturnType<typeof vi.fn>;
  let taskStore: TaskStore;

  function create() {
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.detectChanges();
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/tasks').flush([makeTask({ id: '1', status: TaskStatus.Todo })]);
    TestBed.tick();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    dialogOpenSpy = vi.fn();
    notificationSuccessSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
        { provide: NotificationService, useValue: { success: notificationSuccessSpy, error: vi.fn() } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    taskStore = TestBed.inject(TaskStore);
  });

  afterEach(() => httpMock.verify());

  it('exposes 3 kanban columns', () => {
    const fixture = create();
    expect(fixture.componentInstance.columns.map((c) => c.status)).toEqual([
      TaskStatus.Todo,
      TaskStatus.InProgress,
      TaskStatus.Done,
    ]);
  });

  it('columnIds() returns every column except the given status', () => {
    const fixture = create();
    expect(fixture.componentInstance.columnIds(TaskStatus.Todo)).toEqual([
      TaskStatus.InProgress,
      TaskStatus.Done,
    ]);
  });

  it('openCreateDialog() adds the task and shows a success toast when the dialog resolves', () => {
    const fixture = create();
    const addTaskSpy = vi.spyOn(taskStore, 'addTask').mockImplementation(() => ({ subscribe: () => { /* noop */ } }) as never);
    const result = { title: 'New', status: TaskStatus.Todo };
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(result) });

    fixture.componentInstance.openCreateDialog();

    expect(addTaskSpy).toHaveBeenCalledWith(result);
    expect(notificationSuccessSpy).toHaveBeenCalledWith('Task created.');
  });

  it('openCreateDialog() does nothing when the dialog is dismissed', () => {
    const fixture = create();
    const addTaskSpy = vi.spyOn(taskStore, 'addTask');
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(undefined) });

    fixture.componentInstance.openCreateDialog();

    expect(addTaskSpy).not.toHaveBeenCalled();
    expect(notificationSuccessSpy).not.toHaveBeenCalled();
  });

  it('openEditDialog() updates the task and shows a success toast when the dialog resolves', () => {
    const fixture = create();
    const task = makeTask();
    const updateTaskSpy = vi.spyOn(taskStore, 'updateTask').mockImplementation(() => ({ subscribe: () => { /* noop */ } }) as never);
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of({ title: 'Renamed' }) });

    fixture.componentInstance.openEditDialog(task);

    expect(updateTaskSpy).toHaveBeenCalledWith(task.id, { title: 'Renamed' });
    expect(notificationSuccessSpy).toHaveBeenCalledWith('Task updated.');
  });

  it('onDeleteTask() deletes the task and shows a success toast when confirmed', () => {
    const fixture = create();
    const task = makeTask();
    const deleteTaskSpy = vi.spyOn(taskStore, 'deleteTask').mockImplementation(() => ({ subscribe: () => { /* noop */ } }) as never);
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(true) });

    fixture.componentInstance.onDeleteTask(task);

    expect(deleteTaskSpy).toHaveBeenCalledWith(task.id);
    expect(notificationSuccessSpy).toHaveBeenCalledWith('Task deleted.');
  });

  it('onDeleteTask() does nothing when not confirmed', () => {
    const fixture = create();
    const task = makeTask();
    const deleteTaskSpy = vi.spyOn(taskStore, 'deleteTask').mockImplementation(() => ({ subscribe: () => { /* noop */ } }) as never);
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(false) });

    fixture.componentInstance.onDeleteTask(task);

    expect(deleteTaskSpy).not.toHaveBeenCalled();
  });

  it('onStatusChange() moves the task to the end of the target column', () => {
    const fixture = create();
    const moveTaskSpy = vi.spyOn(taskStore, 'moveTask').mockResolvedValue();
    const task = makeTask({ status: TaskStatus.Todo });

    fixture.componentInstance.onStatusChange({ task, status: TaskStatus.Done });

    expect(moveTaskSpy).toHaveBeenCalledWith(task, TaskStatus.Done, 0);
  });

  it('onDrop() ignores a no-op drop in the same position', () => {
    const fixture = create();
    const moveTaskSpy = vi.spyOn(taskStore, 'moveTask').mockResolvedValue();
    const task = makeTask();
    const container = {} as never;

    fixture.componentInstance.onDrop({
      event: {
        previousContainer: container,
        container,
        previousIndex: 0,
        currentIndex: 0,
        item: { data: task },
      } as never,
      status: TaskStatus.Todo,
    });

    expect(moveTaskSpy).not.toHaveBeenCalled();
  });

  it('onDrop() moves the task when position/container changes', () => {
    const fixture = create();
    const moveTaskSpy = vi.spyOn(taskStore, 'moveTask').mockResolvedValue();
    const task = makeTask();

    fixture.componentInstance.onDrop({
      event: {
        previousContainer: {} as never,
        container: {} as never,
        previousIndex: 0,
        currentIndex: 2,
        item: { data: task },
      } as never,
      status: TaskStatus.InProgress,
    });

    expect(moveTaskSpy).toHaveBeenCalledWith(task, TaskStatus.InProgress, 2);
  });
});
