import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Task, TaskStatus } from '../../../../core/models';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { getTaskDueStatus } from '../../../../shared/utils';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, MatButtonModule, UserAvatar],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();
  /** Read-only mode hides edit/delete/status actions (used by calendar day view). */
  readonly readonlyMode = input(false);

  readonly edit = output<Task>();
  readonly delete = output<Task>();
  readonly statusChange = output<{ task: Task; status: TaskStatus }>();

  readonly TaskStatus = TaskStatus;

  readonly isOverdue = computed(() => {
    const task = this.task();
    return task.status !== TaskStatus.Done && (task.isOverdue ?? new Date(task.dueDate) < new Date());
  });

  readonly dueStatus = computed(() => getTaskDueStatus(this.task()));

  readonly nextStatuses = computed(() =>
    Object.values(TaskStatus).filter((status) => status !== this.task().status),
  );

  onEdit(): void {
    this.edit.emit(this.task());
  }

  onDelete(): void {
    this.delete.emit(this.task());
  }

  onStatusChange(status: TaskStatus): void {
    this.statusChange.emit({ task: this.task(), status });
  }
}
