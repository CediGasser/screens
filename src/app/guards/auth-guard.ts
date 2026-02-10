import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { AuthService } from '../services/auth-service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private auth: AuthService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async canActivate(): Promise<boolean | UrlTree> {
    // SSR: always allow
    if (!this.isBrowser) {
      return true;
    }

    // Browser: enforce auth
    if (this.auth.isAuthenticated()) {
      return true;
    }

    // Redirect to auth server with current URL as state
    const currentUrl = this.document.location.pathname + this.document.location.search;
    await this.auth.login(currentUrl);
    return false;
  }
}
