import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings State Interface
 * Defines the structure and actions for the settings store
 */
interface SettingsState {
  // Appearance preferences
  weekendHighlightColor: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  showSeconds: boolean;
  defaultView: 'analog' | 'digital' | 'list';
  
  // Time preferences
  nightHoursStart: number; // 0-23
  nightHoursEnd: number; // 0-23
  
  // Notification preferences
  enableNotifications: boolean;
  meetingReminders: boolean;

  // Highlight preferences (ListView)
  highlightAutoClear: boolean;
  highlightDuration: number; // in seconds
  
  // Actions
  setWeekendHighlightColor: (color: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setDateFormat: (format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => void;
  setShowSeconds: (show: boolean) => void;
  setDefaultView: (view: 'analog' | 'digital' | 'list') => void;
  setNightHours: (start: number, end: number) => void;
  setEnableNotifications: (enable: boolean) => void;
  setMeetingReminders: (enable: boolean) => void;
  setHighlightAutoClear: (autoClear: boolean) => void;
  setHighlightDuration: (duration: number) => void;
  resetSettings: () => void;
}

// Default settings to use for reset function
const DEFAULT_SETTINGS = {
  weekendHighlightColor: 'red',
  timeFormat: '12h' as const,
  dateFormat: 'MM/DD/YYYY' as const,
  showSeconds: true,
  defaultView: 'list' as const,
  nightHoursStart: 20,
  nightHoursEnd: 6,
  enableNotifications: false,
  meetingReminders: false,
  highlightAutoClear: true,
  highlightDuration: 120, // Default 120 seconds (2 minutes)
};

/**
 * Settings Store
 * Manages application settings and preferences with persistence
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      ...DEFAULT_SETTINGS,
      
      // Action implementations
      setWeekendHighlightColor: (color) => set({ weekendHighlightColor: color }),
      setTimeFormat: (format) => set({ timeFormat: format }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setShowSeconds: (show) => set({ showSeconds: show }),
      setDefaultView: (view) => set({ defaultView: view }),
      setNightHours: (start, end) => set({ nightHoursStart: start, nightHoursEnd: end }),
      setEnableNotifications: (enable) => set({ enableNotifications: enable }),
      setMeetingReminders: (enable) => set({ meetingReminders: enable }),
      setHighlightAutoClear: (autoClear) => set({ highlightAutoClear: autoClear }),
      setHighlightDuration: (duration) => set({ highlightDuration: Math.max(10, duration) }), // Ensure minimum duration
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'settings-storage', // Local storage key
    }
  )
);

/**
 * Helper function to convert color name to Tailwind classes
 */
export const getWeekendHighlightClass = (color: string): string => {
  switch (color) {
    case 'red':
      return 'bg-red-50/30 dark:bg-red-900/10';
    case 'blue':
      return 'bg-blue-50/30 dark:bg-blue-900/10';
    case 'green':
      return 'bg-green-50/30 dark:bg-green-900/10';
    case 'purple':
      return 'bg-purple-50/30 dark:bg-purple-900/10';
    case 'amber':
      return 'bg-amber-50/30 dark:bg-amber-900/10';
    case 'pink':
      return 'bg-pink-50/30 dark:bg-pink-900/10';
    case 'indigo':
      return 'bg-indigo-50/30 dark:bg-indigo-900/10';
    default:
      return 'bg-red-50/30 dark:bg-red-900/10'; // Default to red
  }
};
