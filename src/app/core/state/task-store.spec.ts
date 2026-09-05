import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task, TaskPriority, TaskStatus } from '../models';
import { TaskStore } from './task-store';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Task 1',
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

describe('TaskStore', () => {
  let store: TaskStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushInitial(tasks: Task[]) {
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/tasks').flush(tasks);
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();
  }

  describe('derived signals', () => {
    it('tasks()/tasksByStatus() group the resource value by status', async () => {
      const tasks = [
        makeTask({ id: '1', status: TaskStatus.Todo }),
        makeTask({ id: '2', status: TaskStatus.InProgress }),
        makeTask({ id: '3', status: TaskStatus.Done }),
        makeTask({ id: '4', status: TaskStatus.Todo }),
      ];
      await flushInitial(tasks);

      expect(store.tasks().length).toBe(4);
      expect(store.tasksByStatus()[TaskStatus.Todo].map((t) => t.id)).toEqual(['1', '4']);
      expect(store.tasksByStatus()[TaskStatus.InProgress].map((t) => t.id)).toEqual(['2']);
      expect(store.tasksByStatus()[TaskStatus.Done].map((t) => t.id)).toEqual(['3']);
    });

    it('liveStats() computes total/completed/inProgress/overdue counts', async () => {
      const tasks = [
        makeTask({ id: '1', status: TaskStatus.Done }),
        makeTask({ id: '2', status: TaskStatus.InProgress }),
        makeTask({ id: '3', status: TaskStatus.Todo, isOverdue: true }),
      ];
      await flushInitial(tasks);

      const stats = store.liveStats();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.overdue).toBe(1);
    });

    it('liveStats() counts tasks created within the last week', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const tasks = [
        makeTask({ id: '1', createdAt: threeDaysAgo }),
        makeTask({ id: '2', createdAt: twoWeeksAgo }),
      ];
      await flushInitial(tasks);

      expect(store.liveStats().addedThisWeek).toBe(1);
    });

    it('liveStats() counts tasks completed today', async () => {
      const now = new Date().toISOString();
      const tasks = [makeTask({ id: '1', status: TaskStatus.Done, completedAt: now })];
      await flushInitial(tasks);

      expect(store.liveStats().completedToday).toBe(1);
    });

    it('liveStats() counts tasks moved to in-progress today', async () => {
      const now = new Date().toISOString();
      const tasks = [makeTask({ id: '1', status: TaskStatus.InProgress, movedToInProgressAt: now })];
      await flushInitial(tasks);

      expect(store.liveStats().inProgressToday).toBe(1);
    });

    it('liveStats() counts overdue tasks due today', async () => {
      const now = new Date().toISOString();
      const tasks = [makeTask({ id: '1', isOverdue: true, dueDate: now })];
      await flushInitial(tasks);

      expect(store.liveStats().overdueToday).toBe(1);
    });
  });

  describe('addTask', () => {
    it('appends to the end of the target status column and reloads + records activity', async () => {
      await flushInitial([makeTask({ id: '1', status: TaskStatus.Todo, order: 0 })]);

      store.addTask({
        title: 'New task',
        description: '',
        status: TaskStatus.Todo,
        priority: TaskPriority.Medium,
        dueDate: new Date().toISOString(),
        assignee: { id: 'u1', name: 'Jane Doe', avatar: 'JD', email: 'jane@example.com' },
        tags: [],
      });

      const createReq = httpMock.expectOne('http://localhost:3000/tasks');
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body.order).toBe(1);
      createReq.flush(makeTask({ id: '2', title: 'New task', order: 1 }));

      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });
  });

  describe('updateTask', () => {
    it('sets completedAt when transitioning into Done', async () => {
      await flushInitial([makeTask({ id: '1', status: TaskStatus.Todo })]);

      store.updateTask('1', { status: TaskStatus.Done });

      const req = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.status).toBe(TaskStatus.Done);
      expect(req.request.body.completedAt).toBeTruthy();
      req.flush({});
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });

    it('clears completedAt when transitioning out of Done', async () => {
      await flushInitial([makeTask({ id: '1', status: TaskStatus.Done, completedAt: new Date().toISOString() })]);

      store.updateTask('1', { status: TaskStatus.Todo });

      const req = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(req.request.body.completedAt).toBeNull();
      req.flush({});
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });

    it('does not touch completedAt when the status is unchanged', async () => {
      await flushInitial([makeTask({ id: '1', status: TaskStatus.Todo })]);

      store.updateTask('1', { title: 'Renamed' });

      const req = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(req.request.body.completedAt).toBeUndefined();
      req.flush({});
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });

    it('sets movedToInProgressAt when transitioning into InProgress', async () => {
      await flushInitial([makeTask({ id: '1', status: TaskStatus.Todo })]);

      store.updateTask('1', { status: TaskStatus.InProgress });

      const req = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(req.request.body.movedToInProgressAt).toBeTruthy();
      req.flush({});
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });
  });

  describe('deleteTask', () => {
    it('DELETEs the task then reloads + records activity', async () => {
      await flushInitial([makeTask({ id: '1' })]);

      store.deleteTask('1');

      const req = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });
  });

  describe('moveTask', () => {
    it('reindexes tasks within the same column', async () => {
      const t1 = makeTask({ id: '1', status: TaskStatus.Todo, order: 0 });
      const t2 = makeTask({ id: '2', status: TaskStatus.Todo, order: 1 });
      await flushInitial([t1, t2]);

      const movePromise = store.moveTask(t1, TaskStatus.Todo, 1);

      const req = httpMock.expectOne('http://localhost:3000/tasks/2');
      expect(req.request.body).toEqual({ order: 0 });
      req.flush({});

      const req2 = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(req2.request.body).toEqual({ order: 1, status: TaskStatus.Todo });
      req2.flush({});

      await movePromise;
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });

    it('reindexes the source column when moving across columns', async () => {
      const t1 = makeTask({ id: '1', status: TaskStatus.Todo, order: 0 });
      const t2 = makeTask({ id: '2', status: TaskStatus.Todo, order: 1 });
      const t3 = makeTask({ id: '3', status: TaskStatus.InProgress, order: 0 });
      await flushInitial([t1, t2, t3]);

      const movePromise = store.moveTask(t1, TaskStatus.InProgress, 1);

      const targetReq = httpMock.expectOne('http://localhost:3000/tasks/1');
      expect(targetReq.request.body).toEqual({
        order: 1,
        status: TaskStatus.InProgress,
        movedToInProgressAt: expect.any(String),
      });
      targetReq.flush({});

      const sourceReq = httpMock.expectOne('http://localhost:3000/tasks/2');
      expect(sourceReq.request.body).toEqual({ order: 0 });
      sourceReq.flush({});

      await movePromise;
      TestBed.tick();
      httpMock.expectOne('http://localhost:3000/tasks').flush([]);
    });
  });
});
