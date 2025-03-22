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
  businessHoursStart: number; // 0-23
  businessHoursEnd: number; // 0-23
  nightHoursStart: number; // 0-23
  nightHoursEnd: number; // 0-23
  
  // Notification preferences
  enableNotifications: boolean;
  meetingReminders: boolean;
  
  // Actions
  setWeekendHighlightColor: (color: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setDateFormat: (format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => void;
  setShowSeconds: (show: boolean) => void;
  setDefaultView: (view: 'analog' | 'digital' | 'list') => void;
  setBusinessHours: (start: number, end: number) => void;
  setNightHours: (start: number, end: number) => void;
  setEnableNotifications: (enable: boolean) => void;
  setMeetingReminders: (enable: boolean) => void;
  resetSettings: () => void;
}

// Default settings to use for reset function
const DEFAULT_SETTINGS = {
  weekendHighlightColor: 'red',
  timeFormat: '12h' as const,
  dateFormat: 'MM/DD/YYYY' as const,
  showSeconds: false,
  defaultView: 'analog' as const,
  businessHoursStart: 9,
  businessHoursEnd: 17,
  nightHoursStart: 20,
  nightHoursEnd: 6,
  enableNotifications: false,
  meetingReminders: false,
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
      setBusinessHours: (start, end) => set({ businessHoursStart: start, businessHoursEnd: end }),
      setNightHours: (start, end) => set({ nightHoursStart: start, nightHoursEnd: end }),
      setEnableNotifications: (enable) => set({ enableNotifications: enable }),
      setMeetingReminders: (enable) => set({ meetingReminders: enable }),
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
