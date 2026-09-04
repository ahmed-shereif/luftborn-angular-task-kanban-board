import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Task, TaskPriority, TaskStatus } from '../../../core/models';
import { NotificationService } from '../../../core/services';
import { FilterStore, TaskStore } from '../../../core/state';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { TaskColumn, TaskColumnDropEvent } from '../components/task-column/task-column';
import { TaskFilterBar } from '../components/task-filter-bar/task-filter-bar';
import { TaskFormDialog, TaskFormDialogData, TaskFormResult } from '../components/task-form-dialog/task-form-dialog';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: TaskStatus.Todo, title: 'To Do' },
  { status: TaskStatus.InProgress, title: 'In Progress' },
  { status: TaskStatus.Done, title: 'Done' },
];

@Component({
  selector: 'app-task-list-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, TaskColumn, TaskFilterBar],
  templateUrl: './task-list-page.html',
  styleUrl: './task-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  private readonly taskStore = inject(TaskStore);
  private readonly filterStore = inject(FilterStore);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  readonly columns = COLUMNS;

  readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly debouncedSearch = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(280), distinctUntilChanged()),
    { initialValue: '' },
  );

  readonly status = this.filterStore.status;
  readonly priority = this.filterStore.priority;

  readonly tasksByStatus = computed(() => {
    const filtered = new Set(this.taskStore.filteredTasks().map((task) => task.id));
    const byStatus = this.taskStore.tasksByStatus();
    return {
      [TaskStatus.Todo]: byStatus[TaskStatus.Todo].filter((task) => filtered.has(task.id)),
      [TaskStatus.InProgress]: byStatus[TaskStatus.InProgress].filter((task) => filtered.has(task.id)),
      [TaskStatus.Done]: byStatus[TaskStatus.Done].filter((task) => filtered.has(task.id)),
    };
  });

  constructor() {
    effect(() => this.filterStore.setSearchTerm(this.debouncedSearch()));
  }

  onStatusFilterChange(value: TaskStatus | 'all'): void {
    this.filterStore.setStatus(value);
  }

  onPriorityFilterChange(value: TaskPriority | 'all'): void {
    this.filterStore.setPriority(value);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<TaskFormDialog, TaskFormDialogData, TaskFormResult>(TaskFormDialog, {
      data: {},
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
