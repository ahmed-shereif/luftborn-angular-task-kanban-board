import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services';
import { TaskStore } from '../../core/state';
import { TaskFormDialog, TaskFormDialogData, TaskFormResult } from '../../features/tasks/components/task-form-dialog/task-form-dialog';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidenav {
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly taskStore = inject(TaskStore);

  readonly links: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/tasks', label: 'Tasks', icon: 'checklist' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar_today' },
    { path: '/analytics', label: 'Analytics', icon: 'bar_chart' },
    { path: '/team', label: 'Team', icon: 'group' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];

  openCreateTask(): void {
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
}
