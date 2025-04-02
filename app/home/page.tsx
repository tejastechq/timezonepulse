'use client';

import React, { useState, useEffect } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import { ViewProvider } from '@/app/contexts/ViewContext';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';
import { useTimezoneStore } from '@/store/timezoneStore';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const { hydrate } = useTimezoneStore();

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'TimezonePulse - Home',
    description: 'Welcome to TimezonePulse - Track, compare, and convert time across multiple timezones with ease.',
    url: 'https://www.timezonepulse.com/home',
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

  return (
    <main className="min-h-screen">
      <JsonLd data={jsonLd} />
      <ViewProvider>
        <IntegrationsProvider>
          <div className="container mx-auto px-4 py-8">
            {/* Clean page - content removed as requested */}
          </div>
        </IntegrationsProvider>
      </ViewProvider>
    </main>
  );
} 