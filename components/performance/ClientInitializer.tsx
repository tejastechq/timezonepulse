'use client';

import { useEffect } from 'react';
import { trackPerformance } from '@/app/sentry';
import { useWebVitalsReport, preloadCriticalAssets } from '@/lib/utils/performance';

/**
 * ClientInitializer component to handle client-side initialization tasks
 * This is used for tasks that should only run on the client:
 * - Performance monitoring
 * - Resource preloading
 * - Error handling
 * - Browser API initialization
 */
export function ClientInitializer() {
  // Use the web vitals reporting hook
  useWebVitalsReport();

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

      // Track memory usage in supporting browsers
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          trackPerformance('js-heap-size', memory.usedJSHeapSize);
          trackPerformance('total-heap-size', memory.totalJSHeapSize);
        }
      }
    }

    // Preload critical assets for better performance
    preloadCriticalAssets();

    // Register service worker for offline support if needed
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .catch(error => {
            console.error('Service worker registration failed:', error);
          });
      });
    }

    // Handle source map errors (reduces console noise)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out source map errors from the console
      const isSourceMapError = 
        args.length > 0 && 
        typeof args[0] === 'string' && 
        (args[0].includes('source map') || 
         args[0].includes('Failed to load resource') ||
         args[0].includes('ChunkLoadError'));
      
      if (!isSourceMapError) {
        originalConsoleError.apply(console, args);
      }
    };

    // Use native lazy loading for images and iframes
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    }

    // Clean up on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 