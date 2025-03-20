'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useTimezoneStore } from '@/store/timezoneStore';
import { ViewProvider } from './contexts/ViewContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { ClientInitializer } from '@/components/performance/ClientInitializer';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { initGlobalErrorHandlers } from '@/lib/utils/errorHandler';
import { type ReactNode } from 'react';

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
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection time, formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false, // Don't refetch on window focus in production
      },
    },
  }));

  // State to track if the component has mounted
  const [mounted, setMounted] = useState(false);
  
  // Initialize timezone store on client side
  const hydrate = useTimezoneStore((state) => state.hydrate);

  // Ensure hydration happens after component mount
  useEffect(() => {
    hydrate();
    setMounted(true);
    
    // Initialize global error handlers
    initGlobalErrorHandlers();
  }, [hydrate]);

  // Fix hydration mismatch by only rendering after component mounts
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ViewProvider>
            <DashboardProvider>
              {/* Initialize client-side performance tracking */}
              <ClientInitializer />
              {children}
            </DashboardProvider>
          </ViewProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 