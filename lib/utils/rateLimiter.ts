/**
 * Dummy rate limiter implementation.
 * This file exists for compatibility purposes but rate limiting is disabled.
 */

// Define dummy rate limiter types
export const rateLimiters = {
  default: { limit: 1000 },
  time: { limit: 1000 },
  cleanup: { limit: 1000 }
};

/**
 * Dummy function that always allows requests.
 * Rate limiting is disabled.
 */
export async function checkRateLimit(key: string, endpoint: keyof typeof rateLimiters = 'default') {
  return {
    success: true,
    limit: 1000,
    remaining: 999,
    resetTime: new Date(Date.now() + 60000),
    error: null
  };
}
