'use client';

import React from 'react';
import { useEffect, useState } from 'react';

/**
 * AnalyticsWrapper ensures analytics components only load on the client
 * and after the page has fully loaded, preventing hydration mismatches
 * and ensuring core content loads first.
 */
export default function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to load analytics when browser is idle
    if (typeof window !== 'undefined') {
      const requestIdleCallback = 
        window.requestIdleCallback || 
        ((cb) => setTimeout(cb, 1000));

      // Load analytics in idle time after main content has loaded
      requestIdleCallback(() => {
        setIsLoaded(true);
      });
    }
  }, []);

  // Only render children when loaded (client-side only)
  return isLoaded ? <>{children}</> : null;
} 