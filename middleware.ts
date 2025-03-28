import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting
const rateLimit = new Map();

export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip = request.ip ?? 'anonymous';
  const rateLimitKey = `${ip}-${request.nextUrl.pathname}`;

  // Rate limiting logic
  const currentTimestamp = Date.now();
  const requestCount = rateLimit.get(rateLimitKey) ?? { count: 0, timestamp: currentTimestamp };

  // Reset count if more than 1 minute has passed
  if (currentTimestamp - requestCount.timestamp > 60000) {
    requestCount.count = 0;
    requestCount.timestamp = currentTimestamp;
  }

  requestCount.count++;
  rateLimit.set(rateLimitKey, requestCount);

  // Limit to 60 requests per minute per IP
  if (requestCount.count > 60) {
    return new NextResponse(JSON.stringify({
      error: 'Too many requests',
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    });
  }

  // Add security headers for API routes
  const response = NextResponse.next();
  
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-RateLimit-Limit', '60');
  response.headers.set('X-RateLimit-Remaining', `${60 - requestCount.count}`);

  // Add CORS headers if needed
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Access-Control-Allow-Origin', 'https://worldclock.app');
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}