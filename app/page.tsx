'use client';

import React, { useState, useEffect } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import TimeZonePulse from '@/components/clock/WorldClock';
import { ViewProvider } from '@/app/contexts/ViewContext';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';
import { useTimezoneStore } from '@/store/timezoneStore';

// No need for separate wrapper component, we'll include that functionality directly
// in this main page component

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const { hydrate } = useTimezoneStore();

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TimezonePulse',
    applicationCategory: 'UtilityApplication',
    description: 'Effortlessly track, compare, and convert time across multiple timezones with TimezonePulse. Stay synchronized with the world, whether for work or travel.',
    operatingSystem: 'Any',
    url: 'https://www.timezonepulse.com',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1256', bestRating: '5', worstRating: '1' },
  };

  // Hydrate the store on client-side
  useEffect(() => {
    hydrate();
    setIsMounted(true);
  }, [hydrate]);

  if (!isMounted) {
    return (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center pt-8">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Force the MobileV2 view for all users
  return (
    <main className="min-h-screen mobile-desktop-container">
      <JsonLd data={jsonLd} />
      <ViewProvider>
        <IntegrationsProvider>
          <TimeZonePulse skipHeading={true} forceMobileV2View={true} /> 
        </IntegrationsProvider>
      </ViewProvider>
    </main>
  );
}
