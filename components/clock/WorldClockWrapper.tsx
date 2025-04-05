'use client';

import React from 'react';
import { useEffect } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimeZonePulse from './WorldClock'; // Import the renamed component (file name is still WorldClock.tsx)
// Removed ViewProvider import
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';

/**
 * WorldClockWrapper component that wraps the TimeZonePulse component with context providers
 * and handles hydration. The heading is now rendered by a Server Component in the parent.
 */
export default function WorldClockWrapper() {
  const { hydrate } = useTimezoneStore();

  // Hydrate the store on client-side
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Skip rendering the heading here since it's rendered by the Server Component
  return (
    // Removed ViewProvider wrapper
    <IntegrationsProvider>
      <TimeZonePulse skipHeading={true} /> 
    </IntegrationsProvider>
  );
}
