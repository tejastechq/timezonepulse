import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce, getCspWithNonce } from './lib/utils/security';

// Simple in-memory rate limiting for Edge Runtime
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in ms
const DEFAULT_RATE_LIMIT = 60;
const TIME_RATE_LIMIT = 120;
const CLEANUP_RATE_LIMIT = 10;

function getRateLimit(endpoint: string): number {
  if (endpoint === 'time') return TIME_RATE_LIMIT;
  if (endpoint === 'cleanup') return CLEANUP_RATE_LIMIT;
  return DEFAULT_RATE_LIMIT;
}

function checkRateLimit(key: string, endpoint: 'default' | 'time' | 'cleanup' = 'default') {
  const now = Date.now();
  const limit = getRateLimit(endpoint);
  
  // Clean up old entries - use Array.from to avoid iterator issues
  Array.from(rateLimits.keys()).forEach(entryKey => {
    const entry = rateLimits.get(entryKey);
    if (entry && now - entry.timestamp > RATE_LIMIT_WINDOW) {
      rateLimits.delete(entryKey);
    }
  });
  
  // Get or create entry
  const entry = rateLimits.get(key) || { count: 0, timestamp: now };
  
  // If entry is old, reset it
  if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.timestamp = now;
  }
  
  entry.count++;
  rateLimits.set(key, entry);
  
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetTime: new Date(entry.timestamp + RATE_LIMIT_WINDOW)
  };
}

export async function middleware(request: NextRequest) {
  // Generate CSP nonce for this request
  const nonce = generateNonce();
  
  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname === '/api/health') {
    const response = NextResponse.next();
    
    // Add comprehensive security headers for all routes
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Add Permissions-Policy header
    response.headers.set(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
    );

    // Add Cross-Origin headers
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    
    // Set CSP header with development/production specific rules
    response.headers.set('Content-Security-Policy', getCspWithNonce(nonce));
    
    // Additional security headers for production only
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      response.headers.set('Expect-CT', 'enforce, max-age=86400');
      
      // Ensure CORS is strict in production
      response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || 'null');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    
    return response;
  }

  // Get client IP from various headers
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  'anonymous';

  // Determine rate limit endpoint based on path
  let endpoint: 'default' | 'time' | 'cleanup' = 'default';
  if (request.nextUrl.pathname === '/api/time') endpoint = 'time';
  if (request.nextUrl.pathname === '/api/cleanup') endpoint = 'cleanup';

  // Check rate limit
  const rateLimitResult = checkRateLimit(`${clientIp}-${request.nextUrl.pathname}`, endpoint);

  if (!rateLimitResult.success) {
    return new NextResponse(JSON.stringify({
      error: 'Rate limit exceeded',
      resetTime: rateLimitResult.resetTime,
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString(),
      },
    });
  }

  // Add security headers for API routes
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', getCspWithNonce(nonce));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-RateLimit-Limit', endpoint === 'time' ? '120' : endpoint === 'cleanup' ? '10' : '60');
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString());
  
  return response;
}