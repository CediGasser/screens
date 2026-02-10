import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { createAuthConfig } from '../auth.config';
import { ConfigService } from './config-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private oauthService: OAuthService,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.configureOAuth();
    }
  }

  private configureOAuth(): void {
    const origin = this.document.location.origin;
    const configService = inject(ConfigService);
    const config = configService.getConfig();
    this.oauthService.configure(
      createAuthConfig(config.oauth.issuer, config.oauth.clientId, origin),
    );
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return this.oauthService.hasValidAccessToken();
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  getIdToken(): string {
    return this.oauthService.getIdToken();
  }

  getUserProfile() {
    return this.oauthService.getIdentityClaims();
  }
}
