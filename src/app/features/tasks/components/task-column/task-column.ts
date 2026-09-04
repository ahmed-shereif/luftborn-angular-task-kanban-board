import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task, TaskStatus } from '../../../../core/models';
import { TaskCard } from '../task-card/task-card';

export interface TaskColumnDropEvent {
  event: CdkDragDrop<Task[]>;
  status: TaskStatus;
}

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [DragDropModule, TaskCard],
  templateUrl: './task-column.html',
  styleUrl: './task-column.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskColumn {
  readonly status = input.required<TaskStatus>();
  readonly title = input.required<string>();
  readonly tasks = input.required<Task[]>();
  /** `cdkDropList` ids of the other columns, so tasks can be dragged between them. */
  readonly connectedTo = input<string[]>([]);

  readonly dropped = output<TaskColumnDropEvent>();
  readonly edit = output<Task>();
  readonly delete = output<Task>();
  readonly statusChange = output<{ task: Task; status: TaskStatus }>();

  onDrop(event: CdkDragDrop<Task[]>): void {
    this.dropped.emit({ event, status: this.status() });
  }
}
