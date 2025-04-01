'use client';

/**
 * Global error handling utilities to catch, log and handle errors across the application.
 * Note: Log rotation, size limits, and long-term storage are typically managed by the
 * deployment platform (e.g., Vercel Log Drains) or a dedicated logging service.
 */

interface ErrorLogData {
  message: string;
  timestamp: string;
  environment: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, unknown>;
}

// Error messages that should not be logged to avoid sensitive data leaks
const SENSITIVE_ERROR_PATTERNS = [
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /secret/i,
  /credential/i,
  /auth/i,
];

function isSensitiveError(message: string): boolean {
  return SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

function sanitizeErrorData(data: unknown): unknown {
  if (typeof data === 'string') {
    // Redact potential sensitive information
    let sanitized = data;
    SENSITIVE_ERROR_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(new RegExp(`${pattern.source}[^\\s]*`, 'gi'), '[REDACTED]');
    });
    return sanitized;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeErrorData(item));
  }
  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = sanitizeErrorData(value);
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * Initialize global error handlers
 * Call this function in the root layout or providers
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Setup global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    const errorData: ErrorLogData = {
      message: event.error?.message || event.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      severity: 'error',
      context: {
        type: event.type,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      }
    };

    if (!isSensitiveError(errorData.message)) {
      console.error('Global error:', sanitizeErrorData(errorData));
    }

    // Prevent the browser's default error handling for broken images
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      event.preventDefault();
    }
  });

  // Setup global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorData: ErrorLogData = {
      message: event.reason?.message || 'Unhandled Promise Rejection',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      severity: 'error',
      context: {
        type: 'unhandledrejection',
        reason: sanitizeErrorData(event.reason),
      }
    };

    if (!isSensitiveError(errorData.message)) {
      console.error('Unhandled promise rejection:', sanitizeErrorData(errorData));
    }
  });

  // Track React errors (in development)
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      const isReactError = args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('React') || arg.includes('Warning:'))
      );

      if (isReactError) {
        const sanitizedArgs = args.map(arg => sanitizeErrorData(arg));
        console.warn('React warning/error detected:', ...sanitizedArgs);
      } else {
        originalConsoleError.apply(console, args);
      }
    };
  }
}

/**
 * Safely execute a function and return a default value if it throws
 */
export function safeExecute<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch (error) {
    if (!isSensitiveError((error as Error).message)) {
      console.error('Error in safeExecute:', sanitizeErrorData(error));
    }
    return defaultValue;
  }
}

/**
 * Format an error for display, ensuring no sensitive data is exposed to the client, especially in production.
 */
export function formatError(error: unknown): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const genericErrorMessage = 'An unexpected error occurred. Please try again later.';

  if (isProduction) {
    // In production, always return a generic message to the client
    return genericErrorMessage;
  } else {
    // In development, provide more details (but still sanitized)
    let detailedMessage = genericErrorMessage; // Default
    if (error instanceof Error) {
      detailedMessage = sanitizeErrorData(error.message) as string;
    } else if (typeof error === 'string') {
      detailedMessage = sanitizeErrorData(error) as string;
    }
    // Ensure we don't return an empty string
    return detailedMessage || genericErrorMessage;
  }
}
