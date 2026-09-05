import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Statistic } from '../models';
import { StatisticsApiService } from './statistics-api.service';

describe('StatisticsApiService', () => {
  let service: StatisticsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatisticsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches statistics from the /statistics endpoint', async () => {
    const stats: Statistic[] = [
      {
        id: '1',
        title: 'Total tasks',
        icon: 'checklist',
        value: 10,
        change: '+2',
        changeLabel: 'this week',
        changeType: 'positive',
        color: 'blue',
      },
    ];

    TestBed.tick();
    const req = httpMock.expectOne('http://localhost:3000/statistics');
    expect(req.request.method).toBe('GET');
    req.flush(stats);
    await Promise.resolve();
    TestBed.tick();

    expect(service.statisticsResource.value()).toEqual(stats);
  });

  it('defaults to an empty array before the response arrives', () => {
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/statistics');
    expect(service.statisticsResource.value()).toEqual([]);
  });
});
