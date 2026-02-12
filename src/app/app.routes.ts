import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Screens',
  },
  {
    path: 'login',
    component: Login,
    title: 'Login',
  },
  {
    path: 'admin',
    component: Admin,
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
