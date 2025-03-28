import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create rate limiters for different endpoints
export const rateLimiters = {
  default: new RateLimiterMemory({
    points: 60, // Number of requests
    duration: 60, // Per 60 seconds
  }),
  
  time: new RateLimiterMemory({
    points: 120,
    duration: 60,
  }),
  
  cleanup: new RateLimiterMemory({
    points: 10,
    duration: 60,
  }),
};

/**
 * Checks if a request should be rate limited
 * @param key Identifier for the request (e.g., IP + route)
 * @param endpoint Which endpoint's rate limiter to use
 * @returns Object containing consume result or error
 */
export async function checkRateLimit(key: string, endpoint: keyof typeof rateLimiters = 'default') {
  try {
    const limiter = rateLimiters[endpoint];
    const result = await limiter.consume(key);
    return {
      success: true,
      remaining: result.remainingPoints,
      resetTime: new Date(Date.now() + result.msBeforeNext),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        resetTime: new Date(Date.now() + (error as any).msBeforeNext || 60000),
      };
    }
    return {
      success: false,
      error: 'Rate limit exceeded',
      resetTime: new Date(Date.now() + 60000),
    };
  }
}