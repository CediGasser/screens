import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-callback',
  template: ``,
})
export class Callback implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.auth.waitForLogin();
    const authState = this.auth.getRedirectState();
    const target = authState || '/';
    this.router.navigateByUrl(target);
  }
}
