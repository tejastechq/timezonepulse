'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useTimezoneStore } from '@/store/timezoneStore';
import { ViewProvider } from './contexts/ViewContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { ClientInitializer } from '@/components/performance/ClientInitializer';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { initGlobalErrorHandlers } from '@/lib/utils/errorHandler';

// Create query client factory with optimized settings
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection time, formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: process.env.NODE_ENV === 'development', // Only enable in development
    },
  },
});

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
  // React Query client with optimized settings for performance
  const [queryClient] = useState(createQueryClient);

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
    
    // Cleanup resources on unmount
    return () => {
      queryClient.clear(); // Clear query cache on unmount to prevent memory leaks
    };
  }, [hydrate, queryClient]);

  // Provide fallback during hydration to prevent mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" aria-hidden="true" />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
            <DashboardProvider>
              {/* Only render performance tracking on client */}
              {typeof window !== 'undefined' && <ClientInitializer />}
              {children}
            </DashboardProvider>
          </ViewProvider>
        </ThemeProvider>
        {/* Add React Query DevTools in non-production environments */}
        {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 