'use client';

import React, { useEffect } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimeZonePulse from '@/components/clock/WorldClock';
import { ViewProvider } from '@/app/contexts/ViewContext';
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

  // Force desktop view by setting disableMobileDetection to true
  return (
    <ViewProvider>
      <IntegrationsProvider>
        <TimeZonePulse skipHeading={true} disableMobileDetection={true} /> 
      </IntegrationsProvider>
    </ViewProvider>
  );
} 