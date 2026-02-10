import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './services/auth-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: ` <main class="main">
    <header>
      <a class="logo" [routerLink]="['/']">
        <h1>{{ title() }}</h1>
      </a>
      <nav class="pill-group">
        @if (authService.isAuthenticated()) {
          <a class="pill" [routerLink]="['/admin']">
            <span>Admin</span>
          </a>
          <button class="pill" (click)="logout()">
            <span>Logout</span>
          </button>
        } @else {
          <a class="pill" [routerLink]="['/login']">
            <span>Login</span>
          </a>
        }
      </nav>
    </header>
    <router-outlet />
  </main>`,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Screens');

  constructor(protected authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
