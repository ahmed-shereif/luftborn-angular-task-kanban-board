import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateTaskDto, TaskPriority, TaskStatus } from '../models';
import { TaskApiService, TaskFilterParams } from './task-api.service';

const ALL_FILTERS: TaskFilterParams = {
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  searchTerm: '',
};

describe('TaskApiService', () => {
  let service: TaskApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('tasksResource / buildTasksUrl', () => {
    it('requests the bare base url when no filters are active', () => {
      TestBed.runInInjectionContext(() => service.tasksResource(() => ALL_FILTERS));
      TestBed.tick();

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('appends plain query params for status/priority/assignee without a search term', () => {
      TestBed.runInInjectionContext(() =>
        service.tasksResource(() => ({
          status: TaskStatus.Todo,
          priority: TaskPriority.High,
          assigneeId: 'user-1',
          searchTerm: '',
        })),
      );
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.startsWith('http://localhost:3000/tasks?'));
      expect(req.request.method).toBe('GET');
      const query = new URLSearchParams(req.request.url.split('?')[1]);
      expect(query.get('status')).toBe(TaskStatus.Todo);
      expect(query.get('priority')).toBe(TaskPriority.High);
      expect(query.get('assignee.id')).toBe('user-1');
      req.flush([]);
    });

    it('builds a `_where` clause combining search with active filters', () => {
      TestBed.runInInjectionContext(() =>
        service.tasksResource(() => ({
          status: TaskStatus.Done,
          priority: 'all',
          assigneeId: 'all',
          searchTerm: 'login bug',
        })),
      );
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.startsWith('http://localhost:3000/tasks?'));
      const query = new URLSearchParams(req.request.url.split('?')[1]);
      const where = JSON.parse(query.get('_where')!);
      expect(where.and[0].or[0].title.contains).toBe('login bug');
      expect(where.and[0].or[1].description.contains).toBe('login bug');
      expect(where.and[1].status.eq).toBe(TaskStatus.Done);
      req.flush([]);
    });

    it('uses just the search OR-clause (no `and`) when no other filters are active', () => {
      TestBed.runInInjectionContext(() =>
        service.tasksResource(() => ({ ...ALL_FILTERS, searchTerm: 'abc' })),
      );
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.startsWith('http://localhost:3000/tasks?'));
      const query = new URLSearchParams(req.request.url.split('?')[1]);
      const where = JSON.parse(query.get('_where')!);
      expect(where.or).toBeTruthy();
      expect(where.and).toBeUndefined();
      req.flush([]);
    });

    it('trims whitespace-only search terms and treats them as no search', () => {
      TestBed.runInInjectionContext(() => service.tasksResource(() => ({ ...ALL_FILTERS, searchTerm: '   ' })));
      TestBed.tick();

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      req.flush([]);
    });
  });

  describe('mutations', () => {
    it('create() POSTs the dto to the base url', () => {
      const dto = { title: 'New' } as unknown as CreateTaskDto;
      service.create(dto).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(dto);
      req.flush({});
    });

    it('update() PATCHes the given id', () => {
      service.update('task-1', { title: 'Renamed' }).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/tasks/task-1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ title: 'Renamed' });
      req.flush({});
    });

    it('delete() DELETEs the given id', () => {
      service.delete('task-1').subscribe();
      const req = httpMock.expectOne('http://localhost:3000/tasks/task-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
