import { Routes } from '@angular/router';

export const CALENDAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./calendar-page/calendar-page').then((m) => m.CalendarPage),
  },
];
