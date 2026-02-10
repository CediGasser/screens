import { AuthConfig } from 'angular-oauth2-oidc';

export function createAuthConfig(issuer: string, clientId: string, origin: string): AuthConfig {
  return {
    issuer: issuer,
    clientId: clientId,
    redirectUri: origin + '/admin',
    responseType: 'code',
    scope: 'openid profile email',
    showDebugInformation: false,
    useSilentRefresh: true,
    silentRefreshRedirectUri: origin + '/silent-refresh.html',
    strictDiscoveryDocumentValidation: false,
  };
}
