import { Routes } from '@angular/router';
import { Home } from './pages/home/home'
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';

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
  }
];
