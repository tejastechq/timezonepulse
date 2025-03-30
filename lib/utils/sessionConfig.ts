import { SessionOptions } from 'iron-session';
import { createSecureHash } from './security';

/**
 * Secure session configuration using iron-session
 */
export const sessionConfig: SessionOptions = {
  password: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'development' ? 'complex_password_at_least_32_characters_long' : ''),
  cookieName: 'world_clock_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true,
    path: '/',
    // Set max age to 7 days
    maxAge: 7 * 24 * 60 * 60
  }
};

/**
 * Type definition for session data
 */
export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
  csrfToken?: string;
  lastActivity?: number;
}

/**
 * Generates a CSRF token for the session
 */
export async function generateCsrfToken(): Promise<string> {
  const random = crypto.getRandomValues(new Uint8Array(32));
  const timestamp = Date.now().toString();
  return await createSecureHash(Array.from(random).join('') + timestamp);
}

/**
 * Validates session age and updates last activity
 */
export function validateSession(session: SessionData): boolean {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const now = Date.now();
  
  if (!session.lastActivity || (now - session.lastActivity) > maxAge) {
    return false;
  }
  
  // Update last activity
  session.lastActivity = now;
  return true;
}