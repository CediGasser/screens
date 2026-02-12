import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <main>
      <router-outlet />
    </main>
    <footer>
      <p>&copy; 2024 Screens. All rights reserved.</p>
      <a [routerLink]="['/admin/suggestions']">
        <span>Admin</span>
      </a>
      @if (authService.isAuthenticated()) {
        <button class="logout-btn" (click)="logout()">Logout</button>
      }
    </footer>
  `,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Screens');

  constructor(protected authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
