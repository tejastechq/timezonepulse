import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce, getCspWithNonce } from './lib/utils/security';

interface RateLimitInfo {
  count: number;
  timestamp: number;
  blocked?: boolean;
}

// Separate limits for different endpoints
const RATE_LIMITS = {
  default: { limit: 60, window: 60000 }, // 60 requests per minute
  '/api/time': { limit: 120, window: 60000 }, // 120 requests per minute for time API
  '/api/cleanup': { limit: 10, window: 60000 }, // 10 requests per minute for cleanup API
};

// Simple in-memory store for rate limiting with automatic cleanup
const rateLimit = new Map<string, RateLimitInfo>();

// Helper function to clean old entries
function cleanupOldEntries(now: number) {
  // Use Array.from to avoid iterator compatibility issues
  Array.from(rateLimit.keys()).forEach(key => {
    const value = rateLimit.get(key);
    if (value && now - value.timestamp > 300000) { // 5 minutes
      rateLimit.delete(key);
    }
  });
}

export async function middleware(request: NextRequest) {
  // Clean up old rate limit entries periodically during requests
  cleanupOldEntries(Date.now());

  // Generate CSP nonce for this request
  const nonce = generateNonce();
  
  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname === '/api/health') {
    const response = NextResponse.next();
    
    // Add security headers for all routes
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Set CSP header with development/production specific rules
    response.headers.set('Content-Security-Policy', getCspWithNonce(nonce));
    
    // Additional security headers for production only
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      response.headers.set('Expect-CT', 'enforce, max-age=86400');
    }
    
    return response;
  }

  // Get client IP from various headers
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  'anonymous';

  const rateLimitKey = `${clientIp}-${request.nextUrl.pathname}`;

  // Get rate limit config for the endpoint
  const rateConfig = RATE_LIMITS[request.nextUrl.pathname as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;

  // Rate limiting logic
  const currentTimestamp = Date.now();
  const requestInfo = rateLimit.get(rateLimitKey) ?? { count: 0, timestamp: currentTimestamp };

  // Check if IP is blocked
  if (requestInfo.blocked) {
    return new NextResponse(JSON.stringify({
      error: 'IP temporarily blocked due to excessive requests',
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '300',
      },
    });
  }

  // Reset count if window has passed
  if (currentTimestamp - requestInfo.timestamp > rateConfig.window) {
    requestInfo.count = 0;
    requestInfo.timestamp = currentTimestamp;
  }

  requestInfo.count++;
  
  // Block IP if consistently hitting limits
  if (requestInfo.count > rateConfig.limit * 2) {
    requestInfo.blocked = true;
    rateLimit.set(rateLimitKey, requestInfo);
    return new NextResponse(JSON.stringify({
      error: 'IP blocked due to excessive requests',
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '300',
      },
    });
  }

  rateLimit.set(rateLimitKey, requestInfo);

  // Return 429 if rate limit exceeded
  if (requestInfo.count > rateConfig.limit) {
    return new NextResponse(JSON.stringify({
      error: 'Too many requests',
      retryAfter: Math.ceil((requestInfo.timestamp + rateConfig.window - currentTimestamp) / 1000),
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
  response.headers.set('Content-Security-Policy', getCspWithNonce(nonce));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}