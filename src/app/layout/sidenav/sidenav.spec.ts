import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sidenav } from './sidenav';

describe('Sidenav', () => {
  it('creates and exposes the expected navigation links', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Sidenav);
    fixture.detectChanges();

    const paths = fixture.componentInstance.links.map((l) => l.path);
    expect(paths).toEqual(['/dashboard', '/tasks', '/calendar', '/analytics', '/team', '/settings']);
  });
});
