'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * HydrationSafeguard prevents hydration mismatches by ensuring components only render
 * on the client when their server/client output would differ.
 * 
 * This is particularly useful for components that:
 * 1. Use Date.now() or other non-deterministic values
 * 2. Use conditional logic based on window/document
 * 3. Might have scripts injected differently on server vs client
 */
export default function HydrationSafeguard({
  children,
  fallback = null
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  // Start with not mounted to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  
  // Use layout effect to run synchronously after DOM mutations
  // but before browser paints (avoids flashes)
  useLayoutEffect(() => {
    setMounted(true);
  }, []);
  
  // On first render, return fallback (or null) to avoid hydration mismatch
  if (!mounted) {
    return fallback ? <>{fallback}</> : null;
  }
  
  // Once mounted on client, render children
  return <>{children}</>;
} 