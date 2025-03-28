'use client';

/**
 * Sentry configuration for tracking errors and performance metrics
 * 
 * This module configures Sentry to monitor application errors and performance,
 * which helps identify issues affecting Core Web Vitals.
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry with appropriate configuration
 * Only initialized in production to avoid noise during development
 */
export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'your-production-domain.com'],
        }),
      ],
      beforeSend(event) {
        // Sanitize error messages and remove sensitive data
        if (event.exception) {
          delete event.request?.cookies;
          delete event.request?.headers;
          delete event.request?.query_string;
        }
        return event;
      },
      // Disable console logging in production
      debug: false,
      enabled: true,
      environment: process.env.NODE_ENV,
    });
  }
}

/**
 * Track specific performance measurements in Sentry
 * @param name Name of the performance measurement
 * @param value Value of the measurement in milliseconds
 */
export function trackPerformance(name: string, value: number): void {
  if (process.env.NODE_ENV === 'production') {
    // Use a safer approach to record metrics
    try {
      Sentry.captureMessage(`Performance: ${name} - ${value}ms`, {
        level: 'info',
        tags: {
          measurement: name,
          value: value.toString(),
        },
      });
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }
}

/**
 * Wrap a component with Sentry error boundary
 * @param component The React component to wrap
 * @param options Configuration options for the error boundary
 */
export function withErrorBoundary(component: React.ComponentType, options = {}) {
  return Sentry.withErrorBoundary(component, {
    fallback: ({ error, componentStack, resetError }) => (
      <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-700 font-semibold text-lg mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-4">We've been notified and will fix this issue as soon as possible.</p>
        <button 
          onClick={resetError} 
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    ),
    ...options
  });
}