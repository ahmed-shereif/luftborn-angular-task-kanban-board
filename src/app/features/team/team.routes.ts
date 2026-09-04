import { Routes } from '@angular/router';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./team-page/team-page').then((m) => m.TeamPage),
  },
];
