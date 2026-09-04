import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskStore } from '../../../../core/state';
import { StatCard } from '../../../../shared/components';

/** Live task-count stat cards rendered above the kanban board. */
@Component({
  selector: 'app-task-stats',
  standalone: true,
  imports: [StatCard],
  templateUrl: './task-stats.html',
  styleUrl: './task-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskStats {
  private readonly taskStore = inject(TaskStore);
  readonly stats = this.taskStore.liveStats;
}
