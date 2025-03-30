import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce, getCspWithNonce } from './lib/utils/security';
import { checkRateLimit, rateLimiters } from './lib/utils/rateLimiter'; // Import rateLimiters

export async function middleware(request: NextRequest) {
  // Generate CSP nonce for this request
  const nonce = generateNonce();
  
  // Prepare base response and apply common security headers early
  const responseHeaders = new Headers(request.headers);
  responseHeaders.set('X-DNS-Prefetch-Control', 'off');
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('X-Permitted-Cross-Domain-Policies', 'none');
  responseHeaders.set('X-XSS-Protection', '1; mode=block');
  responseHeaders.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
  );
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
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

  // Skip rate limiting for static assets and health check
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.startsWith('/public/') || 
      pathname.includes('.') || // Assume files with extensions are assets
      pathname === '/api/health') {
    return NextResponse.next({ headers: responseHeaders });
  }

  // Get client IP from various headers
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                  request.headers.get('x-real-ip')?.trim() ||
                  'anonymous'; // Removed invalid request.ip fallback

  // Determine rate limit endpoint based on path
  let endpoint: keyof typeof rateLimiters = 'default';
  if (pathname === '/api/time') endpoint = 'time';
  if (pathname === '/api/cleanup') endpoint = 'cleanup';
  // Add more specific endpoints if needed, e.g., for login/auth routes

  // Use a unique key for rate limiting (IP + general path category)
  // Using the full pathname might exhaust memory if there are many unique paths
  const rateLimitKey = `${clientIp}-${endpoint}`; 

  // Check rate limit
  const rateLimitResult = await checkRateLimit(rateLimitKey, endpoint);

  if (!rateLimitResult.success) {
    // Apply common headers even to the rate limit response
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Retry-After', Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString());
    
    return new NextResponse(JSON.stringify({
      error: 'Rate limit exceeded',
      resetTime: rateLimitResult.resetTime,
    }), {
      status: 429,
      headers: responseHeaders, // Use the headers object
    });
  }

  // Add rate limit status headers to the successful response
  const limiter = rateLimiters[endpoint];
  responseHeaders.set('X-RateLimit-Limit', limiter.points.toString());
  responseHeaders.set('X-RateLimit-Remaining', (rateLimitResult.remaining ?? 0).toString());
  responseHeaders.set('X-RateLimit-Reset', rateLimitResult.resetTime?.toISOString() || new Date().toISOString());
  
  // Proceed with the request, applying all headers
  return NextResponse.next({
    request: {
      headers: responseHeaders, // Pass headers along
    },
    headers: responseHeaders, // Apply headers to the response
  });
}
