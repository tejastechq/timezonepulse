import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce, getCspWithNonce } from './lib/utils/security';
// Removed rate limiting import

export async function middleware(request: NextRequest) {
  // Generate CSP nonce for this request
  const nonce = generateNonce();
  
  // Prepare base response and apply common security headers early
  const responseHeaders = new Headers(request.headers);
  
  // Set nonce cookie for Next.js to use
  responseHeaders.set('Set-Cookie', `nonce=${nonce}; Path=/; Secure; SameSite=Strict; HttpOnly`);
  
  responseHeaders.set('X-DNS-Prefetch-Control', 'off');
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('X-Permitted-Cross-Domain-Policies', 'none');
  // responseHeaders.set('X-XSS-Protection', '1; mode=block'); // Removed: Deprecated, rely on CSP
  responseHeaders.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
  );
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  // responseHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless'); // Removed COEP to allow vercel.live feedback frame
  responseHeaders.set('Cross-Origin-Resource-Policy', 'same-origin');
  responseHeaders.set('Content-Security-Policy', getCspWithNonce(nonce));

  // Add production-specific headers
  if (process.env.NODE_ENV === 'production') {
    responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    responseHeaders.set('Expect-CT', 'enforce, max-age=86400');
    
    // Ensure CORS is strict in production (adjust origin if needed)
    responseHeaders.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*'); // Consider making this more specific than '*' if possible
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    responseHeaders.set('Access-Control-Max-Age', '86400');
  }

  // Skip for static assets, health check, and time API
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.startsWith('/public/') || 
      pathname.includes('.') || // Assume files with extensions are assets
      pathname === '/api/health' ||
      pathname === '/api/time') { // Skip for time API entirely
    return NextResponse.next({ headers: responseHeaders });
  }

  // Proceed with the request, applying all headers (no rate limiting)
  return NextResponse.next({
    request: {
      headers: responseHeaders,
    },
    headers: responseHeaders,
  });
}
