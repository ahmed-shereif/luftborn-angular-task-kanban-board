import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Sidenav } from '../sidenav/sidenav';
import { Toolbar } from '../toolbar/toolbar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, Toolbar, Sidenav],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly sidenavMode = signal<'over' | 'side'>('side');
  readonly sidenavOpened = signal(true);

  constructor() {
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        this.sidenavMode.set(result.matches ? 'over' : 'side');
        this.sidenavOpened.set(!result.matches);
      });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }
}
