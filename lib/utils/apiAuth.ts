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
  // NOTE: headers() must be awaited when called inside Route Handlers
  const headersList = await headers(); // Get headers once

  // --- Origin Check ---
  const origin = headersList.get('origin');
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

  // Block requests if origin exists and doesn't match the allowed origin in production
  // In development, allow requests without origin (e.g., Postman) or from localhost derivatives
  if (process.env.NODE_ENV === 'production') {
    if (origin && allowedOrigin && origin !== allowedOrigin) {
      console.warn(`Blocked API request from invalid origin: ${origin}`);
      return NextResponse.json({
        success: false,
        message: 'Invalid origin'
      }, {
        status: 403,
        headers: secureApiHeaders
      });
    }
    // Allow requests without an origin header in production for server-to-server or direct API calls if needed.
    // If stricter control is desired, uncomment the following block:
    // else if (!origin && allowedOrigin) {
    //   console.warn(`Blocked API request without origin header in production`);
    //   return NextResponse.json({ success: false, message: 'Origin header required' }, { status: 403, headers: secureApiHeaders });
    // }
  } else {
    // Development: Allow localhost and missing origin
    if (origin && allowedOrigin && !origin.startsWith('http://localhost:') && origin !== allowedOrigin) {
       console.warn(`Blocked API request from potentially invalid dev origin: ${origin}`);
       return NextResponse.json({ success: false, message: 'Invalid development origin' }, { status: 403, headers: secureApiHeaders });
    }
  }
  // --- End Origin Check ---


  // Allow all access in development unless specifically requiring admin/session
  if (process.env.NODE_ENV === 'development' &&
      options.type !== AuthType.ADMIN &&
      options.type !== AuthType.SESSION) {
    return null; // Authentication successful
  }
  
  // ADMIN auth check
  if (options.type === AuthType.ADMIN) {
    // const headersList = headers(); // Already fetched above
    const authToken = headersList.get('x-admin-token');

    if (!await validateAdminToken(authToken)) {
      console.warn(`Failed ADMIN authentication attempt. Origin: ${origin || 'N/A'}`); // Log failed attempt
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
    console.warn(`Failed SESSION authentication attempt (not implemented). Origin: ${origin || 'N/A'}`); // Log failed attempt
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
