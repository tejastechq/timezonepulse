'use client';

/**
 * Global error handling utilities to catch, log and handle errors across the application
 */

/**
 * Initialize global error handlers
 * Call this function in the root layout or providers
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;
  
  // Setup global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error || event.message);
    
    // Prevent the browser's default error handling for broken images
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      event.preventDefault();
    }
    
    // You can log to an error tracking service here
    // if (window.Sentry) {
    //   window.Sentry.captureException(event.error || new Error(event.message));
    // }
  });
  
  // Setup global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // You can log to an error tracking service here
    // if (window.Sentry) {
    //   window.Sentry.captureException(event.reason);
    // }
  });
  
  // Track React errors (in development mode)
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      const isReactError = args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('React') || arg.includes('Warning:'))
      );
      
      if (isReactError) {
        console.warn('React warning/error detected:');
      }
      
      originalConsoleError.apply(console, args);
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
    console.error('Error in safeExecute:', error);
    return defaultValue;
  }
}

/**
 * Format an error for display
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
} 