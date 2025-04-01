'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getLocalTimezone } from '@/lib/utils/timezone';

/**
 * App version info to track state consistency
 */
export const APP_VERSION = {
  version: '0.1.0',
  buildId: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BUILD_ID || 'dev' : 'client',
  timestamp: Date.now()
};

/**
 * Interface for a timezone in our application
 */
export interface Timezone {
  id: string;
  name: string;
  city?: string;
  country?: string;
  offset?: string;
  abbreviation?: string;
}

/**
 * Interface for the view mode
 */
export type ViewMode = 'analog' | 'digital' | 'list';

/**
 * Interface for the timezone store state
 */
interface TimezoneState {
  timezones: Timezone[];
  viewMode: ViewMode;
  highlightedTime: Date | null;
  localTimezone: string;
  appVersion: typeof APP_VERSION;
  selectedDate: Date;
  showMarsExplanation: boolean;
  hasMarsTimezone: boolean;
  marsExplanationPosition: 'left' | 'right';
  lastAddedMarsTimezoneId: string | null;
  addTimezone: (timezone: Timezone) => void;
  removeTimezone: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setHighlightedTime: (time: Date | null) => void;
  setSelectedDate: (date: Date) => void;
  resetToToday: () => void;
  reorderTimezones: (fromIndex: number, toIndex: number) => void;
  hydrate: () => void;
  resetStore: () => void;
  hideMarsExplanation: () => void;
}

// Get a storage key that's unique to the current origin to prevent cross-port persistence issues
const getStorageKey = () => {
  if (typeof window === 'undefined') return 'timezone-storage';
  return `timezone-storage-${window.location.origin.replace(/[^a-z0-9]/gi, '-')}`;
};

/**
 * Zustand store for managing timezones with persistence
 */
export const useTimezoneStore = create<TimezoneState>()(
  persist(
    (set, get) => {
      // Get the user's local timezone
      const localTz = getLocalTimezone();
      
      // Function to create initial state
      const getInitialState = () => ({
        // Initial state
        timezones: [
          // Always include local timezone as first option
          {
            id: localTz,
            name: `Local (${localTz})`,
            city: 'Local',
            country: '',
          },
          // Add a timezone from a different continent based on user's location
          ...(/^America\//.test(localTz) ? [{
            id: 'Europe/London',
            name: 'London (Europe/London)',
            city: 'London',
            country: 'United Kingdom',
          }] : []),
          ...(/^Europe\//.test(localTz) ? [{
            id: 'Asia/Tokyo',
            name: 'Tokyo (Asia/Tokyo)',
            city: 'Tokyo',
            country: 'Japan',
          }] : []),
          ...(/^Asia\//.test(localTz) ? [{
            id: 'America/New_York',
            name: 'New York (America/New_York)',
            city: 'New York',
            country: 'United States',
          }] : []),
          ...(/^Australia\/|^Pacific\//.test(localTz) ? [{
            id: 'Europe/London',
            name: 'London (Europe/London)',
            city: 'London',
            country: 'United Kingdom',
          }] : []),
          ...(/^Africa\//.test(localTz) ? [{
            id: 'Europe/London',
            name: 'London (Europe/London)',
            city: 'London',
            country: 'United Kingdom',
          }] : []),
          
          // Add a second geographically different timezone
          ...(/^America\//.test(localTz) ? [{
            id: 'Asia/Tokyo',
            name: 'Tokyo (Asia/Tokyo)',
            city: 'Tokyo',
            country: 'Japan',
          }] : []),
          ...(/^Europe\//.test(localTz) ? [{
            id: 'America/New_York',
            name: 'New York (America/New_York)',
            city: 'New York',
            country: 'United States',
          }] : []),
          ...(/^Asia\//.test(localTz) ? [{
            id: 'Europe/London',
            name: 'London (Europe/London)',
            city: 'London',
            country: 'United Kingdom',
          }] : []),
          ...(/^Australia\/|^Pacific\//.test(localTz) ? [{
            id: 'America/New_York',
            name: 'New York (America/New_York)',
            city: 'New York',
            country: 'United States',
          }] : []),
          ...(/^Africa\//.test(localTz) ? [{
            id: 'America/New_York',
            name: 'New York (America/New_York)',
            city: 'New York',
            country: 'United States',
          }] : []),
        ].slice(0, 3), // Ensure we have exactly 3 timezones
        viewMode: 'list' as ViewMode,
        highlightedTime: null,
        localTimezone: localTz,
        selectedDate: new Date(), // Default to today
        appVersion: { ...APP_VERSION, timestamp: Date.now() },
        showMarsExplanation: false,
        hasMarsTimezone: false,
        marsExplanationPosition: 'right' as 'left' | 'right',
        lastAddedMarsTimezoneId: null,
      });
      
      return {
        ...getInitialState(),
        
        // Actions
        addTimezone: (timezone: Timezone) => set((state) => {
          // Check if the timezone ID already exists in the list
          if (state.timezones.some(tz => tz.id === timezone.id)) {
            return state; // Don't add duplicates
          }
          
          const isMarsTimezone = timezone.id.startsWith('Mars/');
          
          // Determine which side of the screen to show the explanation on
          // Based on number of timezones - if it's even, show on right, if odd, show on left
          const position = (state.timezones.length % 2 === 0) ? 'right' : 'left';
          
          // Show the explanation for every Mars timezone addition
          const shouldShowExplanation = isMarsTimezone;
          
          // Return updated state
          return {
            timezones: [...state.timezones, timezone],
            showMarsExplanation: shouldShowExplanation,
            hasMarsTimezone: true,
            marsExplanationPosition: position,
            lastAddedMarsTimezoneId: isMarsTimezone ? timezone.id : state.lastAddedMarsTimezoneId
          };
        }),
        
        removeTimezone: (id: string) => 
          set((state) => ({
            timezones: state.timezones.filter((timezone) => timezone.id !== id)
          })),
          
        setViewMode: (mode: ViewMode) => 
          set({ viewMode: mode }),
          
        setHighlightedTime: (time: Date | null) => 
          set({ highlightedTime: time }),
          
        setSelectedDate: (date: Date) =>
          set({ selectedDate: date }),
        
        resetToToday: () =>
          set({ selectedDate: new Date() }),
          
        reorderTimezones: (fromIndex: number, toIndex: number) => 
          set((state) => {
            const newTimezones = [...state.timezones];
            const [movedItem] = newTimezones.splice(fromIndex, 1);
            newTimezones.splice(toIndex, 0, movedItem);
            return { timezones: newTimezones };
          }),
          
        // Hydration function for client-side
        hydrate: () => {
          // Update version on hydration to track state freshness
          set((state) => ({
            appVersion: { ...APP_VERSION, timestamp: Date.now() }
          }));
        },
        
        // Reset store to initial state
        resetStore: () => {
          // This completely resets the store to initial values
          set(getInitialState());
        },
        
        // Add an action to hide the Mars explanation
        hideMarsExplanation: () => set({ showMarsExplanation: false }),
      };
    },
    {
      name: getStorageKey(),
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // Return mock storage for SSR
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          };
        }
        return localStorage;
      }),
      // Filter out certain fields from persistence
      partialize: (state) => ({
        timezones: state.timezones,
        viewMode: state.viewMode as ViewMode,
        localTimezone: state.localTimezone
      }),
    }
  )
);

// Helper hook to get the current view mode
export const useViewMode = () => useTimezoneStore((state) => state.viewMode);

// Helper hook to get the highlighted time
export const useHighlightedTime = () => useTimezoneStore((state) => state.highlightedTime);

// Helper hook to get the selected date
export const useSelectedDate = () => useTimezoneStore((state) => state.selectedDate);

// Helper hook to get the app version (for debugging)
export const useAppVersion = () => useTimezoneStore((state) => state.appVersion); 