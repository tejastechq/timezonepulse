"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Types of views available in the application
 * Note: This must match the defaultView type in settingsStore.ts
 */
export type ViewType = 'analog' | 'digital' | 'list';

/**
 * Props for the ViewContext
 */
export interface ViewContextProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

/**
 * Context for managing the current view
 */
const ViewContext = createContext<ViewContextProps>({
  currentView: 'list',
  setCurrentView: () => {},
});

/**
 * Provider component for view management
 * Integrates with settingsStore for persistent view preferences
 */
export function ViewProvider({ children }: { children: React.ReactNode }) {
  // For server-side rendering and hydration consistency
  const [isClient, setIsClient] = useState(false);
  
  // Access settingsStore for defaultView and setDefaultView
  const { defaultView, setDefaultView } = useSettingsStore();
  
  // Local state to manage current view (will sync with settings store)
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [initialized, setInitialized] = useState(false);

  // Handle client-side only logic
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize from settingsStore, but only on client
  useEffect(() => {
    if (!isClient) return;

    // Set current view from the settings store defaultView
    // This ensures consistent view preferences across the app
    // Map 'analog' to 'analog' (which was previously 'clocks')
    const mappedView = defaultView === 'analog' ? 'analog' : defaultView;
    setCurrentView(mappedView);
    setInitialized(true);
  }, [isClient, defaultView]);

  // Update both local state and settings store when view changes
  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);

    if (initialized && isClient) {
      // Update the settings store for persistence across sessions
      setDefaultView(view);
    }
  }, [initialized, isClient, setDefaultView]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentView,
    setCurrentView: handleViewChange,
  }), [currentView, handleViewChange]);

  // Return a simpler provider if we're still on server-side
  // to avoid hydration mismatches
  if (!isClient) {
    return (
      <ViewContext.Provider value={{ currentView: 'list', setCurrentView: () => {} }}>
        {children}
      </ViewContext.Provider>
    );
  }

  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
}

/**
 * Hook for accessing the view context
 */
export const useView = () => useContext(ViewContext);
