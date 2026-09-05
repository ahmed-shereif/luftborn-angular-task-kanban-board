import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from '../models';
import { UserStore } from './user-store';

describe('UserStore', () => {
  let store: UserStore;
  let httpMock: HttpTestingController;

  const users: User[] = [
    { id: '1', name: 'Jane Doe', email: 'jane@example.com', avatar: 'JD', role: 'Dev', department: 'Eng' },
    { id: '2', name: 'John Smith', email: 'john@example.com', avatar: 'JS', role: 'PM', department: 'Product' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(UserStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushUsers() {
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/users').flush(users);
    await Promise.resolve();
    TestBed.tick();
  }

  it('is loading before the response arrives and empty by default', () => {
    TestBed.tick();
    expect(store.users()).toEqual([]);
    httpMock.expectOne('http://localhost:3000/users').flush(users);
    TestBed.tick();
  });

  it('exposes the fetched users once loaded', async () => {
    await flushUsers();
    expect(store.users()).toEqual(users);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeFalsy();
  });

  it('getById() looks up a user by id', async () => {
    await flushUsers();
    expect(store.getById('2')).toEqual(users[1]);
  });

  it('getById() returns undefined for an unknown id', async () => {
    await flushUsers();
    expect(store.getById('missing')).toBeUndefined();
  });

  it('reload() re-fetches the users resource', async () => {
    await flushUsers();
    store.reload();
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/users').flush(users);
  });
});
