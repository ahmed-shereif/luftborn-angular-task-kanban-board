import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaskStats } from './task-stats';

describe('TaskStats', () => {
  it('exposes TaskStore.liveStats as `stats`', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(TaskStats);
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach((req) => req.flush([]));

    expect(fixture.componentInstance.stats().total).toBe(0);
  });
});
