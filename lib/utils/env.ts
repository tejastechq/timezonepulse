import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  ADMIN_API_SECRET: z.string().min(32).optional(),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { env, success: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { fieldErrors } = error.flatten();
      const errorMessages = Object.entries(fieldErrors)
        .map(([key, value]) => `${key}: ${value?.join(', ')}`)
        .join('\n');
      
      console.error('Environment validation failed:\n', errorMessages);
      return { 
        success: false as const, 
        error: 'Invalid environment configuration'
      };
    }
    return { 
      success: false as const, 
      error: 'Unknown error validating environment' 
    };
  }
}