import { AuthConfig } from 'angular-oauth2-oidc';

export function createAuthConfig(issuer: string, clientId: string, origin: string): AuthConfig {
  return {
    issuer: issuer,
    clientId: clientId,
    redirectUri: origin + '/auth/callback',
    responseType: 'code',
    scope: 'openid profile email offline_access',
    showDebugInformation: false,
    strictDiscoveryDocumentValidation: false,
  };
}
