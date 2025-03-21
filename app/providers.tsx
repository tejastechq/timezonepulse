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
  // Track initialization errors
  const [initError, setInitError] = useState<Error | null>(null);
  
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
      setInitError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Mark as mounted to fix hydration mismatches
      setMounted(true);
    }
  }, [hydrate]);

  // Provide fallback during hydration to prevent mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" aria-hidden="true" />;
  }

  // Show error if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="p-6 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Initialization Error</h2>
          <p className="mb-4">Failed to initialize the application properly.</p>
          <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
            {initError.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 max-w-md mx-auto my-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-4">We're sorry, but there was an error loading the application.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      }
    >
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