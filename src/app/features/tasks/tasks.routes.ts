import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./task-list-page/task-list-page').then((m) => m.TaskListPage),
  },
];
