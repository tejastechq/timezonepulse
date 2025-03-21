"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { ViewType } from './ViewContext';

/**
 * Interface for dashboard visibility state
 */
interface DashboardVisibility {
  list: boolean;
  clocks: boolean;
  digital: boolean;
}

/**
 * Props for the DashboardContext
 */
export interface DashboardContextProps {
  dashboardVisibility: DashboardVisibility;
  toggleDashboard: (view: ViewType) => void;
  isDashboardVisible: (view: ViewType) => boolean;
}

/**
 * Default visibility state for all views
 */
const defaultVisibility: DashboardVisibility = {
  list: false,
  clocks: false,
  digital: false
};

/**
 * Context for managing dashboard visibility
 */
const DashboardContext = createContext<DashboardContextProps>({
  dashboardVisibility: defaultVisibility,
  toggleDashboard: () => {},
  isDashboardVisible: () => false,
});

/**
 * Provider component for dashboard visibility
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  // For server-side rendering and hydration consistency
  const [isClient, setIsClient] = useState(false);

  const [dashboardVisibility, setDashboardVisibility] = useState<DashboardVisibility>(() => {
    // Return default state for server rendering
    return defaultVisibility;
  });

  const [initialized, setInitialized] = useState(false);

  // Handle client-side only logic
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize from localStorage on the client side
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedPreferences = localStorage.getItem('dashboardVisibility');
      if (savedPreferences) {
        setDashboardVisibility(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error("Error initializing dashboard preferences:", error);
      // Reset to default state if there's an error
      setDashboardVisibility(defaultVisibility);
    } finally {
      setInitialized(true);
    }
  }, [isClient]);

  // Save to localStorage whenever visibility changes, but only if initialized
  useEffect(() => {
    if (!initialized || !isClient) return;

    try {
      localStorage.setItem('dashboardVisibility', JSON.stringify(dashboardVisibility));
    } catch (error) {
      console.error("Error saving dashboard preferences:", error);
    }
  }, [dashboardVisibility, initialized, isClient]);

  /**
   * Toggle dashboard visibility for a specific view
   */
  const toggleDashboard = useCallback((view: ViewType) => {
    setDashboardVisibility(prev => ({
      ...prev,
      [view]: !prev[view]
    }));
  }, []);

  /**
   * Check if dashboard is visible for a specific view
   */
  const isDashboardVisible = useCallback((view: ViewType): boolean => {
    return dashboardVisibility[view];
  }, [dashboardVisibility]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    dashboardVisibility,
    toggleDashboard,
    isDashboardVisible
  }), [dashboardVisibility, toggleDashboard, isDashboardVisible]);

  // If we're still on server or haven't initialized on client yet,
  // we can render a simpler provider to avoid hydration mismatches
  if (!isClient) {
    return (
      <DashboardContext.Provider value={contextValue}>
        {children}
      </DashboardContext.Provider>
    );
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * Hook for accessing the dashboard context
 */
export const useDashboard = () => useContext(DashboardContext); 