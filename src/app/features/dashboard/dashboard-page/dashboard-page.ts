import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityFeed } from '../components/activity-feed/activity-feed';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [ActivityFeed],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
