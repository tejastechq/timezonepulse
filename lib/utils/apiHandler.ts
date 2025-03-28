import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionConfig, SessionData, validateSession } from './sessionConfig';
import { generateNonce } from './security';

type ApiHandler = (
  req: NextRequest,
  session: SessionData,
  nonce: string
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler with security measures
 * - Session validation
 * - CSRF protection
 * - Rate limiting (via middleware)
 * - Secure headers
 */
export function withSecureApi(handler: ApiHandler) {
  return async function secureHandler(req: NextRequest) {
    try {
      // Get session
      const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionConfig);

      // Generate nonce for this request
      const nonce = generateNonce();

      // Validate session if it exists
      if (session.isLoggedIn && !validateSession(session)) {
        return new NextResponse(JSON.stringify({ error: 'Session expired' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Validate CSRF token for non-GET requests
      if (req.method !== 'GET' && session.isLoggedIn) {
        const csrfToken = req.headers.get('x-csrf-token');
        if (!csrfToken || csrfToken !== session.csrfToken) {
          return new NextResponse(JSON.stringify({ error: 'Invalid CSRF token' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
      }

      // Call the handler with session and nonce
      const response = await handler(req, session, nonce);

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    } catch (error) {
      console.error('API Handler error:', error);
      return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
}