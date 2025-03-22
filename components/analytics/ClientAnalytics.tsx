'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import dynamic from 'next/dynamic';

// Safely import the AnalyticsWrapper in a client component
const AnalyticsWrapper = dynamic(
  () => import('@/components/analytics/AnalyticsWrapper'),
  { ssr: false }
);

/**
 * Client-only component for loading analytics
 * This component safely handles analytics loading in a client context
 */
export default function ClientAnalytics() {
  return (
    <AnalyticsWrapper>
      <SpeedInsights />
      <Analytics />
    </AnalyticsWrapper>
  );
} 