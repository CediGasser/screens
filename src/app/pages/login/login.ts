import { Component } from '@angular/core';
import { LoginForm } from './login-form/login-form';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  template:`
  <section class="login-container">
    <app-login-form (onLogin)="loginUser($event)"></app-login-form>
  </section>`,
  styleUrl: './login.css',
})
export class Login {
  loginUser(user: any) {
    console.log('User logged in', user);
  }
}
