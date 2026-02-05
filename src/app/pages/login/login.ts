import { Component } from '@angular/core';
import { LoginForm } from './login-form/login-form';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  template: ` <section class="login-container">
    <app-login-form (onLogin)="loginUser($event)"></app-login-form>
  </section>`,
  styleUrl: './login.css',
})
export class Login {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  loginUser(user: any) {
    this.authService.login(user.email, user.password).then(() => {
      this.router.navigate(['/admin']);
    });
  }
}
