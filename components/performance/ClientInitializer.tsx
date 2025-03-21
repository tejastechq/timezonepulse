'use client';

import { useEffect } from 'react';
import { useWebVitals } from '@/lib/utils/performance';

/**
 * ClientInitializer component for client-side initialization tasks.
 * 
 * This component handles various client-side initialization that
 * should happen only once when the app loads in the browser:
 * - Sets up web vitals monitoring
 * - Initializes PWA functionality (if used)
 * - Sets up client-side logging
 */
export function ClientInitializer() {
  // Initialize web vitals monitoring
  useWebVitals();

  // Run any client-side only initialization
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      // Initialize any client-side only code here
      console.log('Client initialized');
      
      // Register service worker for PWA capabilities (if implemented)
      // if ('serviceWorker' in navigator) {
      //   window.addEventListener('load', () => {
      //     navigator.serviceWorker.register('/sw.js').catch(err => {
      //       console.error('Service worker registration failed:', err);
      //     });
      //   });
      // }
    } catch (error) {
      console.error('Error in client initialization:', error);
    }
  }, []);

  // This component doesn't render anything visible
  return null;
} 