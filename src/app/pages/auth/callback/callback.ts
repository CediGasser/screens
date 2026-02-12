import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-callback',
  template: `
    <section>
      <h1>Logging in...</h1>
      <p>Please wait while we log you in and redirect you to the app.</p>
    </section>
  `,
  styleUrl: './callback.css',
})
export class Callback implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.auth.waitForLogin();
    const authState = this.auth.getRedirectState();
    console.log('Login successful, redirecting to:', authState);
    const target = authState || '/';
    this.router.navigateByUrl(target);
  }
}
