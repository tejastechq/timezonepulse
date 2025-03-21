'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { useTimezoneStore } from '@/store/timezoneStore';
import { ViewProvider } from './contexts/ViewContext';
import { ClientInitializer } from '@/components/performance/ClientInitializer';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { initGlobalErrorHandlers } from '@/lib/utils/errorHandler';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers component to wrap all context providers in one place
 * 
 * This component ensures that all providers are initialized properly
 * and wraps the application in the correct provider order.
 * This helps with performance by making sure hydration happens correctly.
 */
export function Providers({ children }: ProvidersProps) {
  // State to track if the component has mounted
  const [mounted, setMounted] = useState(false);
  
  // Initialize timezone store on client side
  const hydrate = useTimezoneStore((state) => state.hydrate);

  // Ensure hydration happens after component mount
  useEffect(() => {
    try {
      // Initialize global error handlers
      initGlobalErrorHandlers();
      
      // Hydrate timezone store
      hydrate();
    } catch (error) {
      console.error("Error during providers initialization:", error);
    } finally {
      // Mark as mounted to fix hydration mismatches
      setMounted(true);
    }
  }, [hydrate]);

  // Provide fallback during hydration to prevent mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" aria-hidden="true" />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        // Use forced-colors for better accessibility
        forcedTheme={
          typeof window !== 'undefined' && 
          window.matchMedia?.('(forced-colors: active)').matches ? 
          'light' : undefined
        }
      >
        <ViewProvider>
          {/* Only render performance tracking on client */}
          {typeof window !== 'undefined' && <ClientInitializer />}
          {children}
        </ViewProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 