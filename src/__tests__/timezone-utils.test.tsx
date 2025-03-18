import { 
  getCurrentTimeInTimezone,
  isBusinessHours,
  getUtcOffset,
  isDaylightSavingTime,
  getTimezoneAbbreviation,
  getCommonTimezones
} from '@/lib/timezone-utils';
import { DateTime } from 'luxon';
import { vi } from 'vitest';

// Mock DateTime for consistent testing
vi.mock('luxon', () => {
  const mockDateTime = {
    hour: 12,
    minute: 0,
    weekday: 3,
    isInDST: false,
    offset: 0,
    toFormat: (format) => {
      if (format === 'ZZ') return '+00:00';
      if (format === 'ZZZZ') return 'GMT';
      return '12:00 PM';
    },
  };
  
  return {
    DateTime: {
      now: () => ({
        setZone: () => mockDateTime,
      }),
    },
  };
});

describe('Timezone Utils', () => {
  test('isBusinessHours returns correct value', () => {
    const dateTime = DateTime.now().setZone('UTC');
    
    // 12:00 PM on a weekday should be business hours
    expect(isBusinessHours(dateTime)).toBe(true);
    
    // Mock a time outside business hours
    const mockOutsideHours = {
      ...dateTime,
      hour: 6,
    };
    
    expect(isBusinessHours(mockOutsideHours)).toBe(false);
  });
  
  test('getUtcOffset returns formatted offset', () => {
    expect(getUtcOffset('UTC')).toBe('+00:00');
  });
  
  test('getTimezoneAbbreviation returns abbreviation', () => {
    expect(getTimezoneAbbreviation('UTC')).toBe('GMT');
  });
  
  test('getCommonTimezones returns array of timezone info', () => {
    const timezones = getCommonTimezones();
    
    expect(Array.isArray(timezones)).toBe(true);
    expect(timezones.length).toBeGreaterThan(0);
    expect(timezones[0]).toHaveProperty('id');
    expect(timezones[0]).toHaveProperty('name');
    expect(timezones[0]).toHaveProperty('city');
    expect(timezones[0]).toHaveProperty('abbreviation');
  });
}); 