import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retries a GET on a transient error and succeeds', fakeAsync(() => {
    let result: unknown;
    httpClient.get('/api/tasks').subscribe((res) => (result = res));

    httpMock
      .expectOne('/api/tasks')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    tick(1000);
    httpMock.expectOne('/api/tasks').flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  }));

  it('gives up after the max retry count and propagates the error', fakeAsync(() => {
    let caught: unknown;
    httpClient.get('/api/tasks').subscribe({ error: (err) => (caught = err) });

    for (let attempt = 0; attempt < 4; attempt++) {
      httpMock
        .expectOne('/api/tasks')
        .flush(null, { status: 503, statusText: 'Service Unavailable' });
      tick(2000);
    }

    expect(caught).toBeTruthy();
    httpMock.verify();
  }));

  it('does not retry a non-transient error', fakeAsync(() => {
    let caught: unknown;
    httpClient.get('/api/tasks').subscribe({ error: (err) => (caught = err) });

    httpMock.expectOne('/api/tasks').flush(null, { status: 404, statusText: 'Not Found' });
    tick(1000);

    expect(caught).toBeTruthy();
  }));

  it('does not retry non-GET requests', fakeAsync(() => {
    let caught: unknown;
    httpClient.post('/api/tasks', {}).subscribe({ error: (err) => (caught = err) });

    httpMock
      .expectOne('/api/tasks')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    tick(1000);

    expect(caught).toBeTruthy();
  }));
});
