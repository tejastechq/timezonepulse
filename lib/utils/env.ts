import { z } from 'zod';

const envSchema = z.object({
  // Base configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Security configuration
  SESSION_SECRET: z.string().min(32),
  ADMIN_API_SECRET: z.string().min(32),
  CSP_REPORT_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  
  // Rate limiting configuration
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(60),
  
  // CORS configuration (optional, defaults to same origin)
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  CORS_ALLOWED_METHODS: z.string().optional(),
  
  // Cookie security
  COOKIE_SECURE: z.coerce.boolean().default(process.env.NODE_ENV === 'production'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): { success: true; data: EnvConfig } | { success: false; error: string } {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n');
      return { success: false, error: `Environment validation failed:\n${issues}` };
    }
    return { success: false, error: 'Unknown environment validation error' };
  }
}

// Export validated environment
const env = validateEnv();
if (!env.success) {
  console.error(env.error);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

export const config = env.success ? env.data : {} as EnvConfig;