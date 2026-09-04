import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Task, TaskPriority, TaskStatus } from '../../../core/models';
import { NotificationService } from '../../../core/services';
import { FilterStore, TaskStore } from '../../../core/state';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { TaskColumn, TaskColumnDropEvent } from '../components/task-column/task-column';
import { TaskFilterBar } from '../components/task-filter-bar/task-filter-bar';
import { TaskFormDialog, TaskFormDialogData, TaskFormResult } from '../components/task-form-dialog/task-form-dialog';
import { TaskStats } from '../components/task-stats/task-stats';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: TaskStatus.Todo, title: 'To Do' },
  { status: TaskStatus.InProgress, title: 'In Progress' },
  { status: TaskStatus.Done, title: 'Done' },
];

@Component({
  selector: 'app-task-list-page',
  standalone: true,
  imports: [TaskColumn, TaskFilterBar, TaskStats],
  templateUrl: './task-list-page.html',
  styleUrl: './task-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  // since TaskStore injected in root, its state is shared across the entire application.
  // and will call the api only when the it is injected for the first time.
  private readonly taskStore = inject(TaskStore);
  private readonly filterStore = inject(FilterStore);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  readonly columns = COLUMNS;

  readonly status = this.filterStore.status;
  readonly priority = this.filterStore.priority;

  readonly tasksByStatus = this.taskStore.tasksByStatus;

  onStatusFilterChange(value: TaskStatus | 'all'): void {
    this.filterStore.setStatus(value);
  }

  onPriorityFilterChange(value: TaskPriority | 'all'): void {
    this.filterStore.setPriority(value);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<TaskFormDialog, TaskFormDialogData, TaskFormResult>(TaskFormDialog, {
      data: {},
      width: '90vw',
      maxWidth: '480px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.taskStore.addTask(result);
        this.notification.success('Task created.');
      }
    });
  }

  openEditDialog(task: Task): void {
    const ref = this.dialog.open<TaskFormDialog, TaskFormDialogData, TaskFormResult>(TaskFormDialog, {
      data: { task },
      width: '90vw',
      maxWidth: '480px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.taskStore.updateTask(task.id, result);
        this.notification.success('Task updated.');
      }
    });
  }

  onDeleteTask(task: Task): void {
    const data: ConfirmDialogData = {
      title: 'Delete task',
      message: `Are you sure you want to delete "${task.title}"? This can't be undone.`,
      confirmText: 'Delete',
    };
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.taskStore.deleteTask(task.id);
        this.notification.success('Task deleted.');
      }
    });
  }

  onStatusChange(event: { task: Task; status: TaskStatus }): void {
    const targetCount = this.tasksByStatus()[event.status].length;
    this.taskStore.moveTask(event.task, event.status, targetCount);
  }

  onDrop({ event, status }: TaskColumnDropEvent): void {
    console.log('👨‍💻', event, status);
    const task = event.item.data as Task;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    this.taskStore.moveTask(task, status, event.currentIndex);
  }

  columnIds(status: TaskStatus): string[] {
    return this.columns.map((column) => column.status).filter((id) => id !== status);
  }
}
