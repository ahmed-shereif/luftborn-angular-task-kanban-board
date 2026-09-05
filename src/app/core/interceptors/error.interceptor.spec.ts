import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackBarOpenSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    snackBarOpenSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: snackBarOpenSpy } },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function expectToastMessage(message: string) {
    expect(snackBarOpenSpy).toHaveBeenCalledWith(message, 'Dismiss', {
      duration: 5000,
      panelClass: 'snackbar-error',
    });
  }

  it('re-throws the original error after notifying', () => {
    let caught: unknown;
    httpClient.get('/api/thing').subscribe({ error: (err) => (caught = err) });

    httpMock.expectOne('/api/thing').flush(null, { status: 404, statusText: 'Not Found' });

    expect(caught).toBeTruthy();
  });

  it('maps status 0 to a connectivity message', () => {
    httpClient.get('/api/thing').subscribe({ error: () => {} });
    httpMock.expectOne('/api/thing').error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown' });
    expectToastMessage('Unable to reach the server. Check your connection.');
  });

  it('uses the server-provided message when present', () => {
    httpClient.get('/api/thing').subscribe({ error: () => {} });
    httpMock
      .expectOne('/api/thing')
      .flush({ message: 'Custom server message' }, { status: 400, statusText: 'Bad Request' });
    expectToastMessage('Custom server message');
  });

  it.each([
    [400, 'Invalid request. Please check your input.'],
    [401, 'You are not signed in. Please log in and try again.'],
    [403, 'You do not have permission to perform this action.'],
    [404, 'The requested resource was not found.'],
    [408, 'The request timed out. Please try again.'],
    [409, 'This item was changed elsewhere. Please refresh and retry.'],
    [422, 'Validation failed. Please check your input.'],
    [429, 'Too many requests. Please wait and try again.'],
    [500, 'Server error. Please try again later.'],
    [502, 'Server is temporarily unavailable. Please try again later.'],
    [503, 'Service unavailable. Please try again later.'],
    [504, 'Server took too long to respond. Please try again.'],
  ])('maps status %i to the expected message', (status, expected) => {
    httpClient.get('/api/thing').subscribe({ error: () => {} });
    httpMock.expectOne('/api/thing').flush(null, { status, statusText: 'Error' });
    expectToastMessage(expected);
  });

  it('falls back to a generic message for an unmapped status code', () => {
    httpClient.get('/api/thing').subscribe({ error: () => {} });
    httpMock.expectOne('/api/thing').flush(null, { status: 418, statusText: "I'm a teapot" });
    expectToastMessage('Request failed (status 418).');
  });
});
