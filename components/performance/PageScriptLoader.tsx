'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Client-only component that loads scripts safely after hydration
 * to prevent React hydration mismatches
 */
export default function PageScriptLoader({ 
  scriptPath,
  priority = 'afterInteractive'
}: { 
  scriptPath: string;
  priority?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive';
}) {
  // Load module preload link via imperative DOM manipulation
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    // Create a modulepreload link
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = scriptPath;
    document.head.appendChild(link);
    
    return () => {
      // Cleanup on unmount
      document.head.removeChild(link);
    };
  }, [scriptPath]);
  
  return (
    <Script 
      id={`preload-${scriptPath.replace(/[^\w]/g, '-')}`}
      strategy={priority}
      dangerouslySetInnerHTML={{
        __html: `
          // This script is handled by PageScriptLoader
          console.log("[PageScriptLoader] Loaded ${scriptPath}");
        `
      }}
    />
  );
} 