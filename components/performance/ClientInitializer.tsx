'use client';

import { useEffect } from 'react';
import { trackPerformance } from '@/app/sentry';

/**
 * ClientInitializer component to handle client-side initialization tasks
 * This is used for tasks that should only run on the client
 */
export function ClientInitializer() {
  useEffect(() => {
    // Track initial page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Record navigation timing
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      if (navigationTiming) {
        // Extract the duration value from the navigation timing entry
        trackPerformance('navigation-timing', navigationTiming.duration);
      }

      // Track first contentful paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        // Extract the startTime value from the paint entry
        trackPerformance('first-contentful-paint', fcp.startTime);
      }
    }

    // Handle source map errors (reduces console noise)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out source map errors from the console
      const isSourceMapError = 
        args.length > 0 && 
        typeof args[0] === 'string' && 
        (args[0].includes('source map') || args[0].includes('Failed to load resource'));
      
      if (!isSourceMapError) {
        originalConsoleError.apply(console, args);
      }
    };

    // Clean up on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 