import dynamic from 'next/dynamic';
import HeadingMCP from './HeadingMCP';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';

// Define page metadata including resource prioritization
export const metadata: Metadata = {
  other: {
    'bfcache-eligible': 'true',
  },
};

// Load WorldClockWrapper dynamically to avoid blocking paint
const WorldClockWrapper = dynamic(
  () => import('@/components/clock/WorldClockWrapper'),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-screen p-8">
        {/* MCP-optimized static heading rendered immediately */}
        <HeadingMCP />
        <div className="flex items-center justify-center pt-8">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  // Define JSON-LD schema for the World Clock application
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TimezonePulse', // Updated name
    applicationCategory: 'UtilityApplication',
    // Updated description to match metadata.ts
    description: 'Effortlessly track, compare, and convert time across multiple timezones with TimezonePulse. Stay synchronized with the world, whether for work or travel.',
    operatingSystem: 'Any', // Generally applicable
    url: 'https://www.timezonepulse.com', // Updated URL
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1256',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <main className="min-h-screen">
      {/* Add JSON-LD schema for better SEO */}
      <JsonLd data={jsonLd} />
      
      {/* Render the MCP heading at the top level for immediate painting */}
      <HeadingMCP />
      <WorldClockWrapper />
    </main>
  );
}
