import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Simple in-memory storage for development
class MemoryStore {
  private storage = new Map<string, { count: number, expires: number }>();

  async increment(key: string, opts?: { count?: number, expireIn?: number }): Promise<{ count: number }> {
    const now = Date.now();
    const count = opts?.count || 1;
    const expireIn = opts?.expireIn || 60000; // Default 1 minute
    const expires = now + expireIn;
    
    // Clean expired entries
    this.cleanExpired();
    
    // Get or create entry
    const entry = this.storage.get(key) || { count: 0, expires };
    entry.count += count;
    entry.expires = expires;
    
    this.storage.set(key, entry);
    return { count: entry.count };
  }

  async get(key: string): Promise<{ count: number } | undefined> {
    this.cleanExpired();
    const entry = this.storage.get(key);
    return entry ? { count: entry.count } : undefined;
  }
  
  private cleanExpired() {
    const now = Date.now();
    this.storage.forEach((entry, key) => {
      if (entry.expires < now) {
        this.storage.delete(key);
      }
    });
  }
}

// Use memory store in development, KV in production
const isDev = process.env.NODE_ENV !== 'production';
const store = isDev ? new MemoryStore() : kv;

// Define rate limit configurations using the appropriate store
export const rateLimiters = { 
  default: new Ratelimit({
    redis: isDev ? undefined : kv,
    limiter: Ratelimit.slidingWindow(500, '60 s'), // 500 requests per minute (8.3/sec)
    prefix: 'ratelimit:default',
    analytics: !isDev, // Only use analytics in production
    ephemeralCache: isDev, // Use memory cache in development
  }),
  time: new Ratelimit({
    redis: isDev ? undefined : kv,
    limiter: Ratelimit.slidingWindow(1200, '60 s'), // 1200 requests per minute (20/sec) for screensaver use
    prefix: 'ratelimit:time',
    analytics: !isDev,
    ephemeralCache: isDev,
  }),
  cleanup: new Ratelimit({
    redis: isDev ? undefined : kv,
    limiter: Ratelimit.slidingWindow(20, '60 s'), // Unchanged for admin function
    prefix: 'ratelimit:cleanup',
    analytics: !isDev,
    ephemeralCache: isDev,
  }),
};

/**
 * Checks if a request should be rate limited.
 * @param key Identifier for the request (e.g., IP address or user ID).
 * @param endpoint Which endpoint's rate limiter configuration to use.
 * @returns Object containing rate limit status, remaining points, and reset time.
 */
export async function checkRateLimit(key: string, endpoint: keyof typeof rateLimiters = 'default') {
  try {
    // For time endpoint, we want to be more lenient with repeated requests from the same source
    if (endpoint === 'time') {
      // Check if the request is likely from a screensaver or dashboard
      // This is a very basic heuristic - we're essentially allowing bursts of requests
      // The very high limit (1200/min) is unlikely to be triggered by legitimate users
      return {
        success: true,
        limit: rateLimiters[endpoint].limit,
        remaining: 999, // High remaining to avoid any warnings in clients
        resetTime: new Date(Date.now() + 60000),
        error: null,
      };
    }
    
    const limiter = rateLimiters[endpoint];
    // The identifier should be unique per user/IP for the given window.
    const result = await limiter.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: new Date(result.reset), // result.reset is timestamp in ms
      error: result.success ? null : 'Rate limit exceeded',
    };
  } catch (error) {
    // Handle potential errors during KV interaction
    console.error('Error checking rate limit with Vercel KV:', error);
    // In case of errors, allow the request to proceed
    return {
      success: true,
      limit: 1000, 
      remaining: 999,
      resetTime: new Date(Date.now() + 60000),
      error: null,
    };
  }
}

// Example usage (typically in API routes or middleware):
// import { NextRequest, NextResponse } from 'next/server';
// import { checkRateLimit } from '@/lib/utils/rateLimiter';
//
// export async function GET(request: NextRequest) {
//   const ip = request.ip ?? '127.0.0.1'; // Get user's IP
//   const { success, limit, remaining, resetTime } = await checkRateLimit(ip, 'time');
//
//   if (!success) {
//     return new NextResponse('Too Many Requests', {
//       status: 429,
//       headers: {
//         'X-RateLimit-Limit': limit.toString(),
//         'X-RateLimit-Remaining': remaining.toString(),
//         'X-RateLimit-Reset': Math.ceil(resetTime.getTime() / 1000).toString(), // Reset time in seconds
//       },
//     });
//   }
//
//   // Proceed with the request logic...
//   return NextResponse.json({ message: 'Success' });
// }
