import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth-service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private auth: AuthService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    // SSR: always allow
    if (!this.isBrowser) {
      return true;
    }

    // Browser: enforce auth
    if (this.auth.isAuthenticated()) {
      return true;
    }

    // Redirect to auth server with target URL as state
    await this.auth.login(state.url);
    return false;
  }
}
