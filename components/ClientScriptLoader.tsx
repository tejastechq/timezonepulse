'use client';

import dynamic from 'next/dynamic';

// Safely import PageScriptLoader with ssr: false in a client component
const PageScriptLoader = dynamic(
  () => import('@/components/performance/PageScriptLoader'), 
  { ssr: false }
);

/**
 * Client component wrapper for PageScriptLoader
 * This ensures dynamic imports with ssr: false are only used in client components
 */
export default function ClientScriptLoader({ scriptPath }: { scriptPath: string }) {
  return <PageScriptLoader scriptPath={scriptPath} />;
} 