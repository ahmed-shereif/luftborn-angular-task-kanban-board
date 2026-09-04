import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskStore } from '../../../core/state';
import { StatCard } from '../../../shared/components';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [StatCard],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly taskStore = inject(TaskStore);
  readonly stats = this.taskStore.liveStats;
}
