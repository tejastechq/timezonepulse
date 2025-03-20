'use client';

import { useEffect } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import WorldClock from './WorldClock';
import { ViewProvider } from '@/app/contexts/ViewContext';
import { DashboardProvider } from '@/app/contexts/DashboardContext';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';

/**
 * WorldClockWrapper component that wraps the WorldClock component with context providers
 * and handles hydration. The heading is now rendered by a Server Component in the parent.
 */
// million-ignore
export default function WorldClockWrapper() {
  const { hydrate } = useTimezoneStore();

  // Hydrate the store on client-side
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Skip rendering the heading here since it's rendered by the Server Component
  return (
    <ViewProvider>
      <DashboardProvider>
        <IntegrationsProvider>
          <WorldClock skipHeading={true} />
        </IntegrationsProvider>
      </DashboardProvider>
    </ViewProvider>
  );
} 