'use client';

import { useEffect, useState } from 'react';
import { Providers } from '@/app/providers';

/**
 * ClientBoundary component that acts as a boundary between server and client components
 * Ensures proper hydration and client-side behavior
 */
export default function ClientBoundary({ children }: { children: React.ReactNode }) {
  // State to track if hydration is complete
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle client-side initialization after hydration is complete
  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);
    
    // Add hydrated class to html element
    document.documentElement.classList.add('hydrated');
    
    // We need to defer class modifications until after React hydration is complete
    // Use setTimeout to push these operations to the next event loop tick
    window.setTimeout(() => {
      // Handle reduced motion preference with class for React components
      if (document.documentElement.dataset.prefersReducedMotion === 'true') {
        document.documentElement.classList.add('reduce-motion');
      }
      
      // Handle font loading
      if (document.documentElement.dataset.fontsLoaded === 'true') {
        document.documentElement.classList.add('fonts-loaded');
      }
      
      // Handle BFCache restoration
      if (document.documentElement.dataset.bfcacheRestored === 'true') {
        document.documentElement.classList.add('bfcache-restored');
      }
    }, 0);
    
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('hydrated');
    };
  }, []);

  return <Providers>{children}</Providers>;
} 