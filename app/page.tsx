import dynamic from 'next/dynamic';
import HeadingMCP from './HeadingMCP';
import { Metadata } from 'next';

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
  return (
    <main className="min-h-screen">
      {/* Render the MCP heading at the top level for immediate painting */}
      <HeadingMCP />
      <WorldClockWrapper />
    </main>
  );
} 