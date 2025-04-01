'use client'; // Convert to Client Component

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Metadata } from 'next'; // Keep for potential future use, though metadata is usually static
import { JsonLd } from '@/components/seo/JsonLd';
import HeadingMCP from './HeadingMCP'; // Keep for desktop view

// --- Mobile View Imports ---
import { DateTime } from 'luxon';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore'; // Remove direct import of removeTimezone
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'; // Import the hook
// Mobile components are now primarily handled within TimeZonePulse
import TimeZonePulse from '@/components/clock/WorldClock'; // Import the main component

// Define mobile breakpoint (adjust as needed, e.g., Tailwind's 'md' breakpoint)
const MOBILE_BREAKPOINT = '(max-width: 768px)'; // Keep this for the top-level switch

// Load WorldClockWrapper dynamically (for desktop view)
const WorldClockWrapper = dynamic(
  () => import('@/components/clock/WorldClockWrapper'),
  {
    ssr: true, // Keep SSR for desktop initial load if possible
    loading: () => {
      // Need to check for landscape mode here since we're outside the component
      const isMobileLandscapeCheck = typeof window !== 'undefined' ? 
        window.matchMedia('(max-width: 932px) and (max-height: 430px)').matches : false;
      
      return (
        <div className="min-h-screen p-8">
          {!isMobileLandscapeCheck && <HeadingMCP />}
          <div className="flex items-center justify-center pt-8">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      );
    }
  }
);

// Note: Static metadata export might not work as expected in Client Components.
// Consider moving metadata to layout.tsx or using dynamic metadata generation if needed.
// export const metadata: Metadata = { ... };

export default function Home() {
  // --- State and Logic (Most mobile logic is now within TimeZonePulse) ---
  const [isMounted, setIsMounted] = useState(false); // Keep for hydration check
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT); // Keep for top-level switch
  const isMobileLandscape = useMediaQuery('(max-width: 932px) and (max-height: 430px)'); // Keep for loading state

  useEffect(() => {
    setIsMounted(true); // Set mounted state
  }, []);
  // --- Removed mobile-specific logic (time, slots, handlers, etc.) ---

  // JSON-LD for SEO (remains the same)
  const jsonLd = { // Keep SEO data
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

  // Render loading state or null until mounted to prevent hydration mismatch
  if (!isMounted) {
    // Render a basic loading state consistent with dynamic import loading
    return (
      <div className="min-h-screen p-8">
        {/* Conditionally render HeadingMCP based on landscape */}
        {!isMobileLandscape && <HeadingMCP />}
        <div className="flex items-center justify-center pt-8">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // --- Simplified Conditional Rendering ---
  return (
    <main className="min-h-screen"> {/* Apply min-h-screen to the main container */}
      <JsonLd data={jsonLd} /> {/* Keep SEO */}
      {isMobile ? (
        // Render TimeZonePulse directly for mobile view
        // TimeZonePulse now handles its own header and content based on isConsideredMobile internally
        <TimeZonePulse />
      ) : (
        // Render Desktop View (includes HeadingMCP via WorldClockWrapper loading or directly)
        <>
          {!isMobileLandscape && <HeadingMCP />} {/* Render heading if not landscape */}
          <WorldClockWrapper />
        </>
      )}
    </main>
  );
}
