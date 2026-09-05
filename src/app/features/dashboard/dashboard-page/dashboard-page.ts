import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityFeed } from '../components/activity-feed/activity-feed';
import { AnalyticsPage } from '../../analytics/analytics-page/analytics-page';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [ActivityFeed, AnalyticsPage],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
