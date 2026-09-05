import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CreateTaskDto, Task, TaskPriority, TaskStatus } from '../../../../core/models';
import { UserStore } from '../../../../core/state';
import { ImmediateErrorStateMatcher } from '../../../../shared/utils';

export interface TaskFormDialogData {
  task?: Task;
}

export type TaskFormResult = Omit<CreateTaskDto, 'order'>;

/** Rejects past due dates; only applied when creating a new task (editing an already-overdue task is allowed). */
function dueDateNotPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as Date | null;
    if (!value) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(value);
    due.setHours(0, 0, 0, 0);
    return due < today ? { dueDateInPast: true } : null;
  };
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TaskFormDialog, TaskFormResult>);
  private readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly userStore = inject(UserStore);

  readonly isEditMode = !!this.data.task;
  readonly users = this.userStore.users;
  readonly statuses = Object.values(TaskStatus);
  readonly priorities = Object.values(TaskPriority);
  readonly matcher = new ImmediateErrorStateMatcher();

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.maxLength(500)]],
    priority: this.fb.control<TaskPriority>(TaskPriority.Medium, Validators.required),
    status: this.fb.control<TaskStatus>(TaskStatus.Todo, Validators.required),
    dueDate: this.fb.control<Date | null>(null, [
      Validators.required,
      ...(this.isEditMode ? [] : [dueDateNotPastValidator()]),
    ]),
    assigneeId: ['', Validators.required],
    tags: this.fb.array<string>([]),
  });

  // FormArray.value isn't a signal, so this must stay a plain method (a computed() would never re-run).
  tags(): string[] {
    return this.form.controls.tags.value;
  }

  constructor() {
    const task = this.data.task;
    if (task) {
      this.form.patchValue({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: new Date(task.dueDate),
        assigneeId: task.assignee.id,
      });
      task.tags.forEach((tag) => this.form.controls.tags.push(this.fb.control(tag)));
    }
  }

  addTag(event: MatChipInputEvent): void {
    const value = event.value.trim();
    if (value && !this.tags().includes(value)) {
      this.form.controls.tags.push(this.fb.control(value));
    }
    event.chipInput.clear();
  }

  removeTag(index: number): void {
    this.form.controls.tags.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const assignee = this.userStore.getById(value.assigneeId);
    if (!assignee || !value.dueDate) {
      return;
    }

    const result: TaskFormResult = {
      title: value.title,
      description: value.description,
      priority: value.priority,
      status: value.status,
      dueDate: toDateOnlyString(value.dueDate),
      assignee: {
        id: assignee.id,
        name: assignee.name,
        avatar: assignee.avatar,
        email: assignee.email,
      },
      tags: value.tags,
    };

    this.dialogRef.close(result);
  }
}
