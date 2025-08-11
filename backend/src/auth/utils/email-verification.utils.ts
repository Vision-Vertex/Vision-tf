import { randomBytes, createHash } from 'crypto';

export function generateEmailVerificationToken(): string {
  const randomData = randomBytes(32);
  const hash = createHash('sha256');
  hash.update(randomData);
  return hash.digest('hex');
}

export function validateEmailVerificationToken(token: string): boolean {
  // Check if token is provided
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Check if token is exactly 64 characters (32 bytes = 64 hex characters)
  if (token.length !== 64) {
    return false;
  }

  // Check if token contains only valid hex characters (a-f, A-F, 0-9)
  const hexRegex = /^[a-fA-F0-9]+$/;
  return hexRegex.test(token);
}
