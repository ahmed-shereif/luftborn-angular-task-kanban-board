import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Shell } from './shell';

describe('Shell', () => {
  let matches$: Subject<{ matches: boolean }>;

  beforeEach(() => {
    matches$ = new Subject();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: { observe: () => matches$.asObservable() } },
      ],
    });
  });

  it('defaults to "side" mode, opened', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    expect(fixture.componentInstance.sidenavMode()).toBe('side');
    expect(fixture.componentInstance.sidenavOpened()).toBe(true);
  });

  it('switches to "over" mode and closes when the handset breakpoint matches', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();

    matches$.next({ matches: true });

    expect(fixture.componentInstance.sidenavMode()).toBe('over');
    expect(fixture.componentInstance.sidenavOpened()).toBe(false);
  });

  it('switches back to "side" mode and opens when the handset breakpoint no longer matches', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();

    matches$.next({ matches: true });
    matches$.next({ matches: false });

    expect(fixture.componentInstance.sidenavMode()).toBe('side');
    expect(fixture.componentInstance.sidenavOpened()).toBe(true);
  });

  it('toggleSidenav() flips the opened state', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();

    fixture.componentInstance.toggleSidenav();
    expect(fixture.componentInstance.sidenavOpened()).toBe(false);

    fixture.componentInstance.toggleSidenav();
    expect(fixture.componentInstance.sidenavOpened()).toBe(true);
  });
});
