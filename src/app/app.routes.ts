import { Router, Routes } from '@angular/router';
import { Home } from './pages/home/home'
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';
import { inject } from '@angular/core';
import { AuthService } from './services/auth-service';

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
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const canActivate = !authService.isAuthenticated();

        if (!canActivate) {
          console.warn('Already logged in, redirecting to home page');
          const router = inject(Router);
          router.navigate(['/']);
          return false;
        }

        return canActivate;
      }
    ]
  },
  {
    path: 'admin',
    component: Admin,
    title: 'Admin',
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const canActivate = authService.isAuthenticated();

        if (!canActivate) {
          console.warn('Not authenticated, redirecting to login page');
          const router = inject(Router);
          router.navigate(['/login']);
          return false;
        }

        return canActivate;
      }
    ]
  }
];
