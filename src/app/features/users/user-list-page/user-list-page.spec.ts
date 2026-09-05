import { TestBed } from '@angular/core/testing';
import { UserListPage } from './user-list-page';

describe('UserListPage', () => {
  it('creates', () => {
    const fixture = TestBed.createComponent(UserListPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Users');
  });
});
