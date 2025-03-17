'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getLocalTimezone } from '@/lib/utils/timezone';

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
  addTimezone: (timezone: Timezone) => void;
  removeTimezone: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setHighlightedTime: (time: Date | null) => void;
  reorderTimezones: (fromIndex: number, toIndex: number) => void;
  hydrate: () => void;
}

/**
 * Zustand store for managing timezones with persistence
 */
export const useTimezoneStore = create<TimezoneState>()(
  persist(
    (set, get) => {
      // Get the user's local timezone
      const localTz = getLocalTimezone();
      
      return {
        // Initial state
        timezones: [
          {
            id: localTz,
            name: `Local (${localTz})`,
            city: 'Local',
            country: '',
          },
          // Add two default timezones if they're different from local
          ...(localTz !== 'America/New_York' ? [{
            id: 'America/New_York',
            name: 'New York (America/New_York)',
            city: 'New York',
            country: 'United States',
          }] : []),
          ...(localTz !== 'Europe/London' ? [{
            id: 'Europe/London',
            name: 'London (Europe/London)',
            city: 'London',
            country: 'United Kingdom',
          }] : []),
          // If local timezone is either New York or London, add Tokyo as a third option
          ...((localTz === 'America/New_York' || localTz === 'Europe/London') ? [{
            id: 'Asia/Tokyo',
            name: 'Tokyo (Asia/Tokyo)',
            city: 'Tokyo',
            country: 'Japan',
          }] : []),
        ].slice(0, 3), // Ensure we have at most 3 timezones (local + 2 others)
        viewMode: 'analog',
        highlightedTime: null,
        localTimezone: localTz,
        
        // Actions
        addTimezone: (timezone: Timezone) => 
          set((state) => {
            // Check if the timezone already exists in the state
            const exists = state.timezones.some(tz => tz.id === timezone.id);
            
            // If it exists, don't add it again
            if (exists) {
              return { timezones: state.timezones };
            }
            
            // Otherwise add the new timezone
            return {
              timezones: [...state.timezones, timezone]
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
          
        reorderTimezones: (fromIndex: number, toIndex: number) => 
          set((state) => {
            const newTimezones = [...state.timezones];
            const [movedItem] = newTimezones.splice(fromIndex, 1);
            newTimezones.splice(toIndex, 0, movedItem);
            return { timezones: newTimezones };
          }),
          
        // Hydration function for client-side
        hydrate: () => {
          // This is intentionally empty as the persist middleware
          // will handle the hydration automatically
          // We just need this function to be called on the client
        }
      };
    },
    {
      name: 'timezone-storage',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper hook to get the current view mode
export const useViewMode = () => useTimezoneStore((state) => state.viewMode);

// Helper hook to get the highlighted time
export const useHighlightedTime = () => useTimezoneStore((state) => state.highlightedTime); 