import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { ChartData } from 'chart.js';
import { TaskStore } from '../../../core/state';
import { TaskPriority, TaskStatus } from '../../../core/models';
import { ChartCard } from '../components/chart-card/chart-card';

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Done]: 'Done',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.High]: 'High',
  [TaskPriority.Medium]: 'Medium',
  [TaskPriority.Low]: 'Low',
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TREND_WINDOW_DAYS = 30;

/** Formats a Date as an ISO-week key (Mon-based) for grouping the completion trend. */
function toWeekKey(date: Date): string {
  const dayOfWeek = (date.getDay() + 6) % 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOfWeek);
  return monday.toISOString().slice(0, 10);
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [ChartCard],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {
  private readonly taskStore = inject(TaskStore);

  readonly statusDistribution = computed<ChartData<'doughnut'>>(() => {
    const byStatus = this.taskStore.tasksByStatus();
    const statuses = Object.values(TaskStatus);
    return {
      labels: statuses.map((status) => STATUS_LABELS[status]),
      datasets: [
        {
          data: statuses.map((status) => byStatus[status].length),
          backgroundColor: ['#9ca3af', '#2563eb', '#16a34a'],
        },
      ],
    };
  });

  readonly priorityDistribution = computed<ChartData<'bar'>>(() => {
    const tasks = this.taskStore.tasks();
    const priorities = Object.values(TaskPriority);
    return {
      labels: priorities.map((priority) => PRIORITY_LABELS[priority]),
      datasets: [
        {
          label: 'Tasks',
          data: priorities.map((priority) => tasks.filter((t) => t.priority === priority).length),
          backgroundColor: ['#dc2626', '#d97706', '#16a34a'],
        },
      ],
    };
  });

  /** Groups completed tasks by day if the trend window is short, otherwise by week; empty when no `completedAt`. */
  readonly completionTrend = computed<ChartData<'line'>>(() => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - TREND_WINDOW_DAYS * MS_PER_DAY);
    const completed = this.taskStore
      .tasks()
      .filter((t) => !!t.completedAt && new Date(t.completedAt) >= windowStart);

    const useDaily = TREND_WINDOW_DAYS <= 31;
    const keyOf = useDaily ? toDayKey : toWeekKey;

    const counts = new Map<string, number>();
    for (const task of completed) {
      const key = keyOf(new Date(task.completedAt as string));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const sortedKeys = [...counts.keys()].sort();
    return {
      labels: sortedKeys,
      datasets: [
        {
          label: 'Completed',
          data: sortedKeys.map((key) => counts.get(key) ?? 0),
          borderColor: '#2563eb',
          backgroundColor: '#eff6ff',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  });

  readonly hasCompletionData = computed(() => (this.completionTrend().labels?.length ?? 0) > 0);
}
