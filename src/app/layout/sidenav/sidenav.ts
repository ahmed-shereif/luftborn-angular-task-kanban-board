import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidenav {
  readonly links: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/tasks', label: 'Tasks', icon: 'checklist' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar_today' },
    { path: '/analytics', label: 'Analytics', icon: 'bar_chart' },
    { path: '/team', label: 'Team', icon: 'group' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
}
