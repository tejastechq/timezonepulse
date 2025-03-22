'use client';

import React, { useEffect, memo } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import dynamic from 'next/dynamic';
import { ViewProvider } from '@/app/contexts/ViewContext';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';

// Lazily load the WorldClock component to reduce initial JS payload
const WorldClock = dynamic(() => import('./WorldClock'), {
  ssr: true,
  loading: () => (
    <div className="flex justify-center items-center min-h-[300px]">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

/**
 * WorldClockWrapper component that wraps the WorldClock component with context providers
 * and handles hydration. The heading is rendered by a Server Component in the parent.
 */
function WorldClockWrapper() {
  const { hydrate } = useTimezoneStore();

  // Hydrate the store on client-side
  useEffect(() => {
    // Use a short timeout to unblock the main thread during initial render
    const timeoutId = setTimeout(() => {
      hydrate();
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [hydrate]);

  return (
    <ViewProvider>
      <IntegrationsProvider>
        <WorldClock skipHeading={true} />
      </IntegrationsProvider>
    </ViewProvider>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(WorldClockWrapper); 