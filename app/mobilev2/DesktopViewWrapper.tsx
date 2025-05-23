'use client';

import React, { useEffect } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimeZonePulse from '@/components/clock/WorldClock';
// Removed ViewProvider import
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';

/**
 * DesktopViewWrapper component that forces the desktop view on mobile devices
 */
export default function DesktopViewWrapper() {
  const { hydrate } = useTimezoneStore();

  // Hydrate the store on client-side
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Force the specific MobileV2 list view
  return (
    // Removed ViewProvider wrapper
    <IntegrationsProvider>
      <TimeZonePulse skipHeading={true} forceMobileV2View={true} /> 
    </IntegrationsProvider>
  );
}
