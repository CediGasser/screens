import { Component, output, signal } from '@angular/core';
import { form, FormField, required, email, minLength, submit } from '@angular/forms/signals';
import { FormFieldError } from '../../../components/form-field-error/form-field-error';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  imports: [FormField, FormFieldError],
  template:`
  <form (submit)="onSubmit($event)" class="gradient-border animated">
    <div>
      <label for="email">Email:
        <input id="email" [formField]="loginForm.email"/>
      </label>
      <app-form-field-error [fieldState]="loginForm.email()"></app-form-field-error>
    </div>

    <div>
      <label for="password">Password:
        <input type="password" id="password" [formField]="loginForm.password"/>
      </label>
      <app-form-field-error [fieldState]="loginForm.password()"></app-form-field-error>
    </div>

    <button type="submit" [disabled]="loginForm().invalid()">Login</button>
  </form>`,
  styleUrl: './login-form.css',
})
export class LoginForm {
  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel, (fieldPath) => {
    required(fieldPath.email, { message: 'Email is required' });
    email(fieldPath.email, { message: 'Invalid email format' });

    required(fieldPath.password, { message: 'Password is required' });
    minLength(fieldPath.password, 8, { message: 'Password must be at least 8 characters' });
  })

  onLogin = output<LoginData>();

  onSubmit(event: Event) {
    event.preventDefault();

    submit(this.loginForm, async () => {
      this.onLogin.emit(this.loginModel());
    })
  }
}
