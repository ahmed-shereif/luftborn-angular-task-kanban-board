import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-task-list-page',
  standalone: true,
  template: `<h1>Tasks</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {}
