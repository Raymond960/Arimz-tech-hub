import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleUser {
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
  emailVerified: boolean;
}

export interface VerifyGoogleTokenOptions {
  expectedAudience?: string;
  certsOverride?: Record<string, string>;
}

// Global OAuth2Client instance for Google ID token verification
const defaultClient = new OAuth2Client();

export const VALID_GOOGLE_ISSUERS = [
  'accounts.google.com',
  'https://accounts.google.com'
];

/**
 * Cryptographically verifies a Google ID token.
 * Validates:
 *  - Token format & structure (valid 3-part signed JWT)
 *  - RSA-SHA256 signature against Google's public JWKS certificates
 *  - Token expiration (exp > now)
 *  - Valid Google issuer (accounts.google.com or https://accounts.google.com)
 *  - Audience/client ID matches expected audience (if configured)
 *  - Required claims: email, email_verified=true, sub (Google user ID)
 *
 * @throws Error if any validation check fails
 */
export async function verifyGoogleIdToken(
  idToken: string,
  options?: VerifyGoogleTokenOptions
): Promise<VerifiedGoogleUser> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or invalid token: Google ID token must be a non-empty string.');
  }

  const trimmedToken = idToken.trim();
  const parts = trimmedToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token: Google ID token must be a valid 3-part JWT.');
  }

  // Determine expected audience from options or environment variables
  const configuredAudience =
    options?.expectedAudience ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_OAUTH_CLIENT_ID;

  let payload: any = null;

  if (options?.certsOverride) {
    // Used for automated security test suites with controlled test RSA keypairs
    const ticket = await defaultClient.verifySignedJwtWithCertsAsync(
      trimmedToken,
      options.certsOverride,
      configuredAudience || undefined,
      VALID_GOOGLE_ISSUERS
    );
    payload = ticket.getPayload();
  } else {
    // Official Google production verification:
    // Fetches live Google public certificates from https://www.googleapis.com/oauth2/v3/certs,
    // verifies cryptographic RSA signature, expiration, issuer, and audience.
    const ticket = await defaultClient.verifyIdToken({
      idToken: trimmedToken,
      audience: configuredAudience ? configuredAudience.trim() : undefined
    });
    payload = ticket.getPayload();
  }

  if (!payload) {
    throw new Error('Verification failed: Empty token payload.');
  }

  // 1. Validate Issuer
  if (!payload.iss || !VALID_GOOGLE_ISSUERS.includes(payload.iss)) {
    throw new Error(`Invalid token issuer: '${payload.iss}'. Expected accounts.google.com.`);
  }

  // 2. Validate Audience if configured
  if (configuredAudience) {
    const tokenAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!tokenAud.includes(configuredAudience.trim())) {
      throw new Error(`Token audience mismatch: Token audience '${payload.aud}' does not match expected client ID.`);
    }
  }

  // 3. Validate Expiration
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < nowInSeconds) {
    throw new Error('Token has expired.');
  }

  // 4. Validate Required Claims: email
  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Missing required claim: Google ID token must contain an email address.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email.trim())) {
    throw new Error('Invalid email format in Google token payload.');
  }

  // 5. Validate Required Claims: email_verified
  // Google only guarantees authenticity if email_verified is true
  const isVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!isVerified) {
    throw new Error('Google account email is not verified. Unverified accounts cannot authenticate.');
  }

  // 6. Validate Required Claims: sub (Google Subject/User ID)
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Missing required claim: Google ID token must contain a subject identifier (sub).');
  }

  return {
    email: payload.email.trim().toLowerCase(),
    name: (payload.name || payload.email.split('@')[0]).trim(),
    avatar: payload.picture || undefined,
    googleId: payload.sub.trim(),
    emailVerified: isVerified
  };
}
