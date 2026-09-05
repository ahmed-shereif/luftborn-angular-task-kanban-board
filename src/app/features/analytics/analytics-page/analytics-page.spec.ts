import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task, TaskPriority, TaskStatus } from '../../../core/models';
import { AnalyticsPage } from './analytics-page';

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

describe('AnalyticsPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  async function createWithTasks(tasks: Task[]) {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/tasks').flush(tasks);
    await Promise.resolve();
    TestBed.tick();
    fixture.detectChanges();
    return fixture;
  }

  it('statusDistribution groups task counts per status', async () => {
    const fixture = await createWithTasks([
      makeTask({ id: '1', status: TaskStatus.Todo }),
      makeTask({ id: '2', status: TaskStatus.Todo }),
      makeTask({ id: '3', status: TaskStatus.Done }),
    ]);
    const dist = fixture.componentInstance.statusDistribution();
    expect(dist.labels).toEqual(['To Do', 'In Progress', 'Done']);
    expect(dist.datasets[0].data).toEqual([2, 0, 1]);
  });

  it('priorityDistribution groups task counts per priority', async () => {
    const fixture = await createWithTasks([
      makeTask({ id: '1', priority: TaskPriority.High }),
      makeTask({ id: '2', priority: TaskPriority.High }),
      makeTask({ id: '3', priority: TaskPriority.Low }),
    ]);
    const dist = fixture.componentInstance.priorityDistribution();
    expect(dist.labels).toEqual(['High', 'Medium', 'Low']);
    expect(dist.datasets[0].data).toEqual([2, 0, 1]);
  });

  it('hasCompletionData is false when no task has completedAt', async () => {
    const fixture = await createWithTasks([makeTask({ id: '1' })]);
    expect(fixture.componentInstance.hasCompletionData()).toBe(false);
    expect(fixture.componentInstance.completionTrend().labels).toEqual([]);
  });

  it('completionTrend groups completed tasks by day within the trend window', async () => {
    const today = new Date().toISOString();
    const fixture = await createWithTasks([
      makeTask({ id: '1', status: TaskStatus.Done, completedAt: today }),
      makeTask({ id: '2', status: TaskStatus.Done, completedAt: today }),
    ]);

    expect(fixture.componentInstance.hasCompletionData()).toBe(true);
    const trend = fixture.componentInstance.completionTrend();
    expect(trend.labels?.length).toBe(1);
    expect(trend.datasets[0].data).toEqual([2]);
  });

  it('completionTrend excludes tasks completed outside the trend window', async () => {
    const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const fixture = await createWithTasks([makeTask({ id: '1', status: TaskStatus.Done, completedAt: old })]);
    expect(fixture.componentInstance.hasCompletionData()).toBe(false);
  });
});
