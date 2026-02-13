import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Screens',
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    title: 'Admin',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'suggestions',
        loadComponent: () =>
          import('./pages/admin/suggestions/suggestions').then((m) => m.Suggestions),
        title: 'Suggestions',
      },
      {
        path: 'published-devices',
        loadComponent: () =>
          import('./pages/admin/published-devices/published-devices').then(
            (m) => m.PublishedDevices,
          ),
        title: 'Published Devices',
      },
    ],
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/callback/callback').then((m) => m.Callback),
    title: 'Authenticating...',
  },
];
