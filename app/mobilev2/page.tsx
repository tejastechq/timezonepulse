'use client';

import React, { useState, useEffect } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import dynamic from 'next/dynamic';
import './styles.css';

// Import our custom DesktopViewWrapper that forces desktop view
const DesktopViewWrapper = dynamic(
  () => import('./DesktopViewWrapper'),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center pt-8">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
);

export default function MobileV2Page() {
  const [isMounted, setIsMounted] = useState(false);

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TimezonePulse Mobile V2',
    applicationCategory: 'UtilityApplication',
    description: 'Desktop view of TimezonePulse for mobile.',
    operatingSystem: 'Any',
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <main className="min-h-screen mobile-desktop-container">
      <JsonLd data={jsonLd} />
      <DesktopViewWrapper />
    </main>
  );
} 