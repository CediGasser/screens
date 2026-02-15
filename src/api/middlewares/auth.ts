import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedUser {
  authenticated: true;
  sub: string;
  email?: string;
  username?: string;
  groups: string[];
}

export interface UnauthenticatedUser {
  authenticated: false;
}

export type User = AuthenticatedUser | UnauthenticatedUser;

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

let cachedPublicKey: string | null = null;

async function fetchPublicKey(issuer: string): Promise<string> {
  // Fetch OpenID configuration to get JWKS URI
  const configResponse = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!configResponse.ok) {
    throw new Error(`Failed to fetch OpenID configuration: ${configResponse.status}`);
  }
  const config = (await configResponse.json()) as { jwks_uri: string };

  // Fetch JWKS
  const jwksResponse = await fetch(config.jwks_uri);
  if (!jwksResponse.ok) {
    throw new Error(`Failed to fetch JWKS: ${jwksResponse.status}`);
  }
  const jwks = (await jwksResponse.json()) as {
    keys: Array<{ kty: string; use?: string; x5c?: string[]; kid?: string }>;
  };

  // Find a signing key (prefer one with use: 'sig', otherwise take first RSA key)
  const signingKey =
    jwks.keys.find((k) => k.use === 'sig' && k.x5c) ?? jwks.keys.find((k) => k.x5c);

  if (!signingKey?.x5c?.[0]) {
    throw new Error('No valid signing key found in JWKS');
  }

  // Convert x5c to PEM format
  const cert = signingKey.x5c[0];
  const pem = `-----BEGIN CERTIFICATE-----\n${cert.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;

  return pem;
}

export async function initializeAuth(): Promise<void> {
  const issuer = process.env['OAUTH_ISSUER'];
  if (!issuer) {
    throw new Error('OAUTH_ISSUER environment variable is required');
  }

  cachedPublicKey = await fetchPublicKey(issuer);
  console.log('Auth middleware initialized with public key from', issuer);
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  // No token provided - unauthenticated request
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { authenticated: false };
    return next();
  }

  const token = authHeader.slice(7);

  if (!cachedPublicKey) {
    console.error('Auth middleware not initialized - call initializeAuth() first');
    req.user = { authenticated: false };
    return next();
  }

  try {
    const decoded = jwt.verify(token, cachedPublicKey, {
      algorithms: ['RS256'],
    }) as JwtPayload;

    const groupsClaim = decoded['groups'] || [];

    req.user = {
      authenticated: true,
      sub: decoded.sub ?? '',
      email: decoded['email'] as string | undefined,
      username: decoded['preferred_username'] as string | undefined,
      groups: Array.isArray(groupsClaim) ? groupsClaim : [],
    };
  } catch (err) {
    // Invalid token - treat as unauthenticated
    req.user = { authenticated: false };
  }

  return next();
};
