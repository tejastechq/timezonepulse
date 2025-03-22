import dynamic from 'next/dynamic';
import HeadingMCP from './HeadingMCP';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { Suspense } from 'react';
import ClientScriptLoader from '@/components/ClientScriptLoader';

// Define page metadata including resource prioritization
export const metadata: Metadata = {
  other: {
    'bfcache-eligible': 'true',
    // Add priority hint for the main content
    'priority': 'high',
  },
};

// Use dynamic import with proper loading boundary
const WorldClockWrapper = dynamic(
  () => import('@/components/clock/WorldClockWrapper').then(mod => ({
    default: mod.default
  })),
  { 
    ssr: true,
    loading: () => <LoadingFallback />
  }
);

/**
 * Simplified loading fallback that doesn't pull in unnecessary JS
 */
function LoadingFallback() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary-500 animate-spin" />
      <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading world clock...</p>
    </div>
  );
}

export default function HomePage() {
  // Define JSON-LD schema for the World Clock application
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'World Clock',
    applicationCategory: 'UtilityApplication',
    description: 'Track and manage time across multiple timezones with our intuitive World Clock app. Perfect for remote teams and international scheduling.',
    operatingSystem: 'Any',
    url: 'https://worldclock.app',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1256',
    },
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30 px-4 sm:px-6 lg:px-8">
      {/* SEO Optimization */}
      <JsonLd data={jsonLd} />
      
      <div className="w-full max-w-[1280px] mx-auto mb-12">
        <div className="py-8 md:py-12">
          <Suspense fallback={<LoadingFallback />}>
            <WorldClockWrapper />
          </Suspense>
        </div>
      </div>
      
      {/* Script loading handled by client-only component */}
      <ClientScriptLoader scriptPath="/chunks/app-page.js" />
    </main>
  );
} 