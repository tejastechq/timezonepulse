'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HydrationSafeguard from '@/app/components/HydrationSafeguard';
import BfCacheManager from './BfCacheManager';

// Dynamically import components that are only needed on the client
// and might cause hydration mismatches
const ThemeToggle = dynamic(() => import('./theme/ThemeToggle'), { 
  ssr: false 
});

const DateFormatter = dynamic(() => import('./utils/DateFormatter'), { 
  ssr: false 
});

// Load visual components with ssr:false
const GlassmorphismAnimation = dynamic(() => import('./effects/GlassmorphismAnimation'), {
  ssr: false
});

const DevInfo = dynamic(() => import('./utils/DevInfo'), {
  ssr: false
});

/**
 * Loading placeholder for dynamically imported components
 */
function LoadingPlaceholder() {
  return <div className="w-8 h-8 opacity-0"></div>;
}

/**
 * ClientComponents handles loading of components that:
 * 1. Are only needed on the client side
 * 2. Use browser APIs that might cause hydration mismatches
 * 3. Should be deferred until after initial page load
 */
export default function ClientComponents() {
  return (
    <HydrationSafeguard>
      <>
        {/* Add BfCacheManager to handle WebSocket connections */}
        <BfCacheManager />
        
        {/* UI Components */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          <Suspense fallback={<LoadingPlaceholder />}>
            <ThemeToggle />
          </Suspense>
          
          {/* Other client-only components can be added here */}
          <Suspense fallback={<LoadingPlaceholder />}>
            <DateFormatter />
          </Suspense>
        </div>
        
        {/* Visual effects */}
        <Suspense fallback={null}>
          <GlassmorphismAnimation />
        </Suspense>
        
        {/* Developer tools */}
        <Suspense fallback={null}>
          <DevInfo />
        </Suspense>
      </>
    </HydrationSafeguard>
  );
} 