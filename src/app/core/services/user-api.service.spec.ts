import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from '../models';
import { UserApiService } from './user-api.service';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches users from the /users endpoint and exposes them via the resource value', async () => {
    const users: User[] = [
      { id: '1', name: 'Jane Doe', email: 'jane@example.com', avatar: 'JD', role: 'Dev', department: 'Eng' },
    ];

    TestBed.tick();
    const req = httpMock.expectOne('http://localhost:3000/users');
    expect(req.request.method).toBe('GET');
    req.flush(users);
    await Promise.resolve();
    TestBed.tick();

    expect(service.usersResource.value()).toEqual(users);
  });

  it('defaults to an empty array before the response arrives', () => {
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/users');
    expect(service.usersResource.value()).toEqual([]);
  });
});
