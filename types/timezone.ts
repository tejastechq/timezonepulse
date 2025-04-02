import { Timezone } from '@/store/timezoneStore';

// Define the different view types available in TimezonePulse
export type PulseViews = 'list' | 'mobile';

// Interface for a timezone search result
export interface TimezoneSearchResult {
  id: string;
  name: string;
  city?: string;
  country?: string;
  offset: number;
  abbreviation: string;
  isPopular?: boolean;
}

// Interface for a timezone with additional display properties
export interface EnhancedTimezone extends Timezone {
  displayName?: string;
  abbr?: string;
  isDst?: boolean;
  offset?: string;
  formattedOffset?: string;
}

// Interface for time-related display options
export interface TimeDisplayOptions {
  format: '12h' | '24h';
  showSeconds: boolean;
  showTimezoneAbbr: boolean;
  showDate: boolean;
} 