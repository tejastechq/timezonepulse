"use client";

import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

// Define interfaces for context data
interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  type: 'weather' | 'calendar' | 'other';
}

/**
 * Props for the IntegrationsContext
 */
export interface IntegrationsContextProps {
  // Integration management
  integrations: Integration[];
  toggleIntegration: (id: string) => void;
  addIntegration: (integration: Omit<Integration, 'id'>) => void;
  removeIntegration: (id: string) => void;
  initialized: boolean;
}

/**
 * Create a context with default values
 */
const IntegrationsContext = createContext<IntegrationsContextProps>({
  // Integration management defaults
  integrations: [],
  toggleIntegration: () => {},
  addIntegration: () => {},
  removeIntegration: () => {},
  initialized: false,
});

/**
 * Provider component that wraps the application and provides context
 */
export function IntegrationsProvider({ children }: { children: React.ReactNode }) {
  // State for integrations
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [initialized, setInitialized] = useState(false);
  const isClient = typeof window !== 'undefined';

  // Initialize the context with saved data
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Get saved integrations
      const savedIntegrations = localStorage.getItem('integrations');
      if (savedIntegrations) {
        setIntegrations(JSON.parse(savedIntegrations));
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Error loading integrations from localStorage:', error);
      setInitialized(true);
    }
  }, [isClient]);

  // Save data to localStorage when changes occur
  useEffect(() => {
    if (!isClient || !initialized) return;
    
    try {
      // Save integrations
      localStorage.setItem('integrations', JSON.stringify(integrations));
    } catch (error) {
      console.error('Error saving integrations to localStorage:', error);
    }
  }, [integrations, initialized, isClient]);

  // Integration management functions
  const toggleIntegration = useCallback((id: string) => {
    setIntegrations(prevIntegrations => 
      prevIntegrations.map(integration => 
        integration.id === id 
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  }, []);

  const addIntegration = useCallback((integration: Omit<Integration, 'id'>) => {
    const newIntegration = {
      ...integration,
      id: nanoid(),
    };
    
    setIntegrations(prev => [...prev, newIntegration]);
  }, []);

  const removeIntegration = useCallback((id: string) => {
    setIntegrations(prev => prev.filter(integration => integration.id !== id));
  }, []);

  // Create the context value object
  const contextValue: IntegrationsContextProps = {
    // Integration management
    integrations,
    toggleIntegration,
    addIntegration,
    removeIntegration,
    initialized,
  };

  // Provide the context value to the component tree
  return (
    <IntegrationsContext.Provider value={contextValue}>
      {children}
    </IntegrationsContext.Provider>
  );
}

// Custom hook to access the context
export const useIntegrations = () => useContext(IntegrationsContext); 