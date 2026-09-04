import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TaskPriority, TaskStatus } from '../../../../core/models';

export type StatusFilter = TaskStatus | 'all';
export type PriorityFilter = TaskPriority | 'all';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: TaskStatus.Todo, label: 'To Do' },
  { value: TaskStatus.InProgress, label: 'In Progress' },
  { value: TaskStatus.Done, label: 'Done' },
];

const PRIORITY_OPTIONS: PriorityFilter[] = ['all', TaskPriority.High, TaskPriority.Medium, TaskPriority.Low];

/** Status-tabs + priority-menu + new-task toolbar rendered above the kanban board (matches the Task Manager design). */
@Component({
  selector: 'app-task-filter-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './task-filter-bar.html',
  styleUrl: './task-filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterBar {
  readonly status = input.required<StatusFilter>();
  readonly priority = input.required<PriorityFilter>();

  readonly statusChange = output<StatusFilter>();
  readonly priorityChange = output<PriorityFilter>();
  readonly newTask = output<void>();

  readonly statusTabs = STATUS_TABS;
  readonly priorityOptions = PRIORITY_OPTIONS;
}
