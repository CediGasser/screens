import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  template: `
    <section class="login-container">
      <div class="gradient-border animated">
        <h2>Login</h2>
        <p>Sign in with your Authentik account</p>
        <button (click)="login()" class="login-button">Login with Authentik</button>
      </div>
    </section>
  `,
  styleUrl: './login.css',
})
export class Login {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    // If already authenticated, redirect to admin
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  login(): void {
    this.authService.login();
  }
}
