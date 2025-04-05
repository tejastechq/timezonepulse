import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSecureHash } from './security';

/**
 * Authentication types for API endpoints
 */
export enum AuthType {
  NONE = 'none',           // No authentication required
  ADMIN = 'admin',         // Admin API token required
  SESSION = 'session',     // Valid user session required
  RATE_LIMITED = 'rate',   // Only rate limiting applied
}

/**
 * Options for authentication
 */
interface AuthOptions {
  type: AuthType;
  message?: string;        // Custom error message
  status?: number;         // Custom status code
}

/**
 * Validates admin API token for protected endpoints
 */
export async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!process.env.ADMIN_API_SECRET) {
    console.error('ADMIN_API_SECRET not configured');
    return false;
  }
  
  if (!token) return false;
  
  const hash = await createSecureHash(process.env.ADMIN_API_SECRET);
  return hash === token;
}

/**
 * Standard secure response headers for API endpoints
 */
export const secureApiHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer'
};

/**
 * Apply consistent authentication to API handlers
 * @returns NextResponse with error if authentication fails, null if authentication succeeds
 */
export async function authenticateApi(options: AuthOptions = { type: AuthType.RATE_LIMITED }): Promise<NextResponse | null> {
  // Allow all access in development unless specifically requiring admin/session
  if (process.env.NODE_ENV === 'development' && 
      options.type !== AuthType.ADMIN && 
      options.type !== AuthType.SESSION) {
    return null; // Authentication successful
  }
  
  // ADMIN auth check
  if (options.type === AuthType.ADMIN) {
    const headersList = await headers();
    const authToken = headersList.get('x-admin-token');
    
    if (!await validateAdminToken(authToken)) {
      return NextResponse.json({
        success: false,
        message: options.message || 'Unauthorized access'
      }, { 
        status: options.status || 401,
        headers: secureApiHeaders
      });
    }
  }
  
  // SESSION auth check - would typically use iron-session or similar here
  if (options.type === AuthType.SESSION) {
    // Session validation logic should be implemented here
    // For now, return unauthorized as it's not implemented
    return NextResponse.json({
      success: false,
      message: options.message || 'Session authentication not implemented'
    }, { 
      status: options.status || 401,
      headers: secureApiHeaders
    });
  }
  
  // If we get here, authentication was successful
  return null;
}