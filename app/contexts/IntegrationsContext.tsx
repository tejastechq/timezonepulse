"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';

/**
 * Interface for a client reminder
 */
export interface ClientReminder {
  id: string;
  timezone: string;
  text: string;
  time: string; // Format: HH:mm
  days: string[]; // Days of week: 'monday', 'tuesday', etc.
  enabled: boolean;
}

/**
 * Interface for a personal note
 */
export interface PersonalNote {
  id: string;
  timezone: string;
  text: string;
  createdAt: string; // ISO date string
}

/**
 * Interface for contextual information
 */
export interface ContextualInfo {
  timezone: string;
  businessHours: {
    start: string; // Format: HH:mm
    end: string; // Format: HH:mm
  };
  holidays: {
    date: string; // Format: YYYY-MM-DD
    name: string;
  }[];
}

/**
 * Props for the IntegrationsContext
 */
export interface IntegrationsContextProps {
  // Client reminders
  clientReminders: ClientReminder[];
  addClientReminder: (reminder: Omit<ClientReminder, 'id'>) => void;
  updateClientReminder: (id: string, reminder: Partial<ClientReminder>) => void;
  removeClientReminder: (id: string) => void;
  getClientRemindersForTimezone: (timezone: string) => ClientReminder[];
  
  // Personal notes
  personalNotes: PersonalNote[];
  addPersonalNote: (note: Omit<PersonalNote, 'id' | 'createdAt'>) => void;
  updatePersonalNote: (id: string, note: Partial<PersonalNote>) => void;
  removePersonalNote: (id: string) => void;
  getPersonalNotesForTimezone: (timezone: string) => PersonalNote[];
  
  // Contextual information
  contextualInfo: ContextualInfo[];
  addContextualInfo: (info: ContextualInfo) => void;
  updateContextualInfo: (timezone: string, info: Partial<ContextualInfo>) => void;
  removeContextualInfo: (timezone: string) => void;
  getContextualInfoForTimezone: (timezone: string) => ContextualInfo | undefined;
  
  // Notifications
  activeNotifications: { id: string; message: string }[];
  dismissNotification: (id: string) => void;
}

/**
 * Context for managing integrations
 */
const IntegrationsContext = createContext<IntegrationsContextProps>({
  // Client reminders
  clientReminders: [],
  addClientReminder: () => {},
  updateClientReminder: () => {},
  removeClientReminder: () => {},
  getClientRemindersForTimezone: () => [],
  
  // Personal notes
  personalNotes: [],
  addPersonalNote: () => {},
  updatePersonalNote: () => {},
  removePersonalNote: () => {},
  getPersonalNotesForTimezone: () => [],
  
  // Contextual information
  contextualInfo: [],
  addContextualInfo: () => {},
  updateContextualInfo: () => {},
  removeContextualInfo: () => {},
  getContextualInfoForTimezone: () => undefined,
  
  // Notifications
  activeNotifications: [],
  dismissNotification: () => {},
});

/**
 * Provider component for integrations
 */
export function IntegrationsProvider({ children }: { children: React.ReactNode }) {
  // For server-side rendering and hydration consistency
  const [isClient, setIsClient] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // State for client reminders
  const [clientReminders, setClientReminders] = useState<ClientReminder[]>([]);
  
  // State for personal notes
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  
  // State for contextual information
  const [contextualInfo, setContextualInfo] = useState<ContextualInfo[]>([]);
  
  // State for active notifications
  const [activeNotifications, setActiveNotifications] = useState<{ id: string; message: string }[]>([]);
  
  // Handle client-side only logic
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Initialize from localStorage, but only on client
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Load client reminders
      const savedReminders = localStorage.getItem('clientReminders');
      if (savedReminders) {
        setClientReminders(JSON.parse(savedReminders));
      }
      
      // Load personal notes
      const savedNotes = localStorage.getItem('personalNotes');
      if (savedNotes) {
        setPersonalNotes(JSON.parse(savedNotes));
      }
      
      // Load contextual information
      const savedContextualInfo = localStorage.getItem('contextualInfo');
      if (savedContextualInfo) {
        setContextualInfo(JSON.parse(savedContextualInfo));
      }
    } catch (error) {
      console.error('Error loading integrations data:', error);
    } finally {
      setInitialized(true);
    }
  }, [isClient]);
  
  // Save client reminders to localStorage
  useEffect(() => {
    if (!initialized || !isClient) return;
    
    try {
      localStorage.setItem('clientReminders', JSON.stringify(clientReminders));
    } catch (error) {
      console.error('Error saving client reminders:', error);
    }
  }, [clientReminders, initialized, isClient]);
  
  // Save personal notes to localStorage
  useEffect(() => {
    if (!initialized || !isClient) return;
    
    try {
      localStorage.setItem('personalNotes', JSON.stringify(personalNotes));
    } catch (error) {
      console.error('Error saving personal notes:', error);
    }
  }, [personalNotes, initialized, isClient]);
  
  // Save contextual information to localStorage
  useEffect(() => {
    if (!initialized || !isClient) return;
    
    try {
      localStorage.setItem('contextualInfo', JSON.stringify(contextualInfo));
    } catch (error) {
      console.error('Error saving contextual information:', error);
    }
  }, [contextualInfo, initialized, isClient]);
  
  // Check for reminders that need notifications
  useEffect(() => {
    if (!isClient || clientReminders.length === 0) return;
    
    const checkReminders = () => {
      const now = DateTime.now();
      const currentDay = now.weekdayLong.toLowerCase();
      const currentTime = now.toFormat('HH:mm');
      
      clientReminders.forEach(reminder => {
        if (reminder.enabled && reminder.days.includes(currentDay) && reminder.time === currentTime) {
          // Add notification
          const notificationId = `reminder-${reminder.id}-${Date.now()}`;
          const message = `Reminder for ${reminder.timezone}: ${reminder.text}`;
          
          setActiveNotifications(prev => [
            ...prev.filter(n => !n.id.startsWith(`reminder-${reminder.id}`)),
            { id: notificationId, message }
          ]);
          
          // Auto-dismiss after 30 seconds
          setTimeout(() => {
            setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
          }, 30000);
        }
      });
    };
    
    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Initial check
    checkReminders();
    
    return () => clearInterval(interval);
  }, [isClient, clientReminders]);
  
  // Client reminder functions
  const addClientReminder = useCallback((reminder: Omit<ClientReminder, 'id'>) => {
    const newReminder: ClientReminder = {
      ...reminder,
      id: `reminder-${Date.now()}`
    };
    
    setClientReminders(prev => [...prev, newReminder]);
  }, []);
  
  const updateClientReminder = useCallback((id: string, reminder: Partial<ClientReminder>) => {
    setClientReminders(prev => 
      prev.map(r => r.id === id ? { ...r, ...reminder } : r)
    );
  }, []);
  
  const removeClientReminder = useCallback((id: string) => {
    setClientReminders(prev => prev.filter(r => r.id !== id));
  }, []);
  
  const getClientRemindersForTimezone = useCallback((timezone: string) => {
    return clientReminders.filter(r => r.timezone === timezone);
  }, [clientReminders]);
  
  // Personal note functions
  const addPersonalNote = useCallback((note: Omit<PersonalNote, 'id' | 'createdAt'>) => {
    const newNote: PersonalNote = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    setPersonalNotes(prev => [...prev, newNote]);
  }, []);
  
  const updatePersonalNote = useCallback((id: string, note: Partial<PersonalNote>) => {
    setPersonalNotes(prev => 
      prev.map(n => n.id === id ? { ...n, ...note } : n)
    );
  }, []);
  
  const removePersonalNote = useCallback((id: string) => {
    setPersonalNotes(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const getPersonalNotesForTimezone = useCallback((timezone: string) => {
    return personalNotes.filter(n => n.timezone === timezone);
  }, [personalNotes]);
  
  // Contextual information functions
  const addContextualInfo = useCallback((info: ContextualInfo) => {
    setContextualInfo(prev => {
      // Replace if exists, otherwise add
      const exists = prev.some(i => i.timezone === info.timezone);
      if (exists) {
        return prev.map(i => i.timezone === info.timezone ? info : i);
      } else {
        return [...prev, info];
      }
    });
  }, []);
  
  const updateContextualInfo = useCallback((timezone: string, info: Partial<ContextualInfo>) => {
    setContextualInfo(prev => 
      prev.map(i => i.timezone === timezone ? { ...i, ...info } : i)
    );
  }, []);
  
  const removeContextualInfo = useCallback((timezone: string) => {
    setContextualInfo(prev => prev.filter(i => i.timezone !== timezone));
  }, []);
  
  const getContextualInfoForTimezone = useCallback((timezone: string) => {
    return contextualInfo.find(i => i.timezone === timezone);
  }, [contextualInfo]);
  
  // Notification functions
  const dismissNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Client reminders
    clientReminders,
    addClientReminder,
    updateClientReminder,
    removeClientReminder,
    getClientRemindersForTimezone,
    
    // Personal notes
    personalNotes,
    addPersonalNote,
    updatePersonalNote,
    removePersonalNote,
    getPersonalNotesForTimezone,
    
    // Contextual information
    contextualInfo,
    addContextualInfo,
    updateContextualInfo,
    removeContextualInfo,
    getContextualInfoForTimezone,
    
    // Notifications
    activeNotifications,
    dismissNotification,
  }), [
    clientReminders, addClientReminder, updateClientReminder, removeClientReminder, getClientRemindersForTimezone,
    personalNotes, addPersonalNote, updatePersonalNote, removePersonalNote, getPersonalNotesForTimezone,
    contextualInfo, addContextualInfo, updateContextualInfo, removeContextualInfo, getContextualInfoForTimezone,
    activeNotifications, dismissNotification
  ]);
  
  return (
    <IntegrationsContext.Provider value={contextValue}>
      {children}
    </IntegrationsContext.Provider>
  );
}

/**
 * Hook for accessing the integrations context
 */
export const useIntegrations = () => useContext(IntegrationsContext); 