# Environment Variables

This document lists all environment variables used in the World Clock application. Use this as a reference when setting up your development, staging, or production environments.

## Required Environment Variables

These variables must be set for the application to function properly:

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| NODE_ENV | Environment mode (development/production/test) | Yes | development | `production` |
| NEXT_TELEMETRY_DISABLED | Disables Next.js telemetry | No | 1 | `1` |

## Development Environment Variables

These variables are primarily used in development environments:

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| NODE_OPTIONS | Node.js options | No | --max-old-space-size=4096 | `--max-old-space-size=4096` |
| NEXT_WEBPACK_USEPOLLING | Enables webpack polling | No | false | `false` |
| NEXT_SHARP_PATH | Path to Sharp module | No | ./node_modules/sharp | `./node_modules/sharp` |
| NEXT_RSC_STRICT_MODE | Enables strict mode for React Server Components | No | false | `false` |

## Vercel-Specific Environment Variables

These variables are specific to Vercel deployment:

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| VERCEL_URL | URL of the Vercel deployment | No (set by Vercel) | - | `world-clock.vercel.app` |
| VERCEL_ENV | Environment of the Vercel deployment | No (set by Vercel) | - | `production` |

## Feature-Specific Environment Variables

These variables control specific features of the application:

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| NEXT_PUBLIC_ENABLE_ANALYTICS | Enables analytics | No | false | `true` |
| NEXT_PUBLIC_DEFAULT_TIMEZONE | Default timezone | No | UTC | `America/New_York` |

## Authentication Variables (if used)

If you implement authentication, you'll need these variables:

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| NEXTAUTH_URL | URL for NextAuth.js | No | - | `https://world-clock.vercel.app` |
| NEXTAUTH_SECRET | Secret for NextAuth.js | No | - | `your-secret-here` |

## Service Integration Variables (if used)

If you integrate with external services, you'll need these variables:

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| SENTRY_DSN | Sentry Data Source Name | No | - | `https://example@sentry.io/123456` |
| NEXT_PUBLIC_SENTRY_DSN | Public Sentry DSN | No | - | `https://example@sentry.io/123456` |

## Setting Environment Variables in Different Environments

### Local Development

Create a `.env.local` file in the project root with your environment variables:

```
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Vercel Deployment

1. Go to your project settings in the Vercel dashboard
2. Navigate to "Environment Variables"
3. Add each required variable and specify which environments (Production, Preview, Development) it applies to
4. Remember that client-side variables must be prefixed with `NEXT_PUBLIC_`

### GitHub Actions

When using GitHub Actions, add secrets in your repository settings:

1. Go to your repository settings
2. Select "Secrets and variables" > "Actions"
3. Add each secret required for your build
4. Reference them in your workflow file using `${{ secrets.YOUR_SECRET_NAME }}`

## Security Considerations

- Never commit `.env*` files to version control
- Use different values for different environments
- Rotate secrets periodically
- Only use `NEXT_PUBLIC_` prefix for variables that are safe to expose to the client
- Consider using a secret management service for production environments 