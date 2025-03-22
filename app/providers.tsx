'use client';

import React, { memo } from 'react';
import { ThemeProvider } from 'next-themes';
import { ViewProvider } from './contexts/ViewContext';
import { IntegrationsProvider } from './contexts/IntegrationsContext';

/**
 * More efficient Context Providers implementation
 * Using memo to prevent unnecessary re-renders
 */
export const Providers = memo(function Providers({
  children
}: {
  children: React.ReactNode
}) {
  // Create a single context tree to avoid nesting problems
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ViewProvider>
        <IntegrationsProvider>
          {children}
        </IntegrationsProvider>
      </ViewProvider>
    </ThemeProvider>
  );
});

Providers.displayName = 'Providers'; 