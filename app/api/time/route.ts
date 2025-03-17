import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { isValidTimezone } from '@/lib/utils/timezone';

/**
 * GET handler for the time API
 * Returns the current time for a specific timezone
 * 
 * @param request The incoming request
 * @returns Response with the current time information
 */
export async function GET(request: NextRequest) {
  // Get the timezone from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const timezone = searchParams.get('timezone') || 'UTC';
  
  // Validate the timezone
  if (!isValidTimezone(timezone)) {
    return NextResponse.json(
      { error: 'Invalid timezone' },
      { status: 400 }
    );
  }
  
  try {
    // Get the current time in the specified timezone
    const now = DateTime.now().setZone(timezone);
    
    // Format the time information
    const timeInfo = {
      timezone,
      iso: now.toISO(),
      formatted: {
        time: now.toFormat('HH:mm:ss'),
        date: now.toFormat('yyyy-MM-dd'),
        dateTime: now.toFormat('yyyy-MM-dd HH:mm:ss'),
        dayOfWeek: now.toFormat('EEEE'),
        offset: now.toFormat('ZZ'),
        abbreviation: now.toFormat('ZZZZ'),
      },
      isInDST: now.isInDST,
      isBusinessHours: now.hour >= 9 && now.hour < 17,
      isNightTime: now.hour >= 20 || now.hour < 6,
    };
    
    // Return the time information
    return NextResponse.json(timeInfo);
  } catch (error) {
    console.error('Error getting time:', error);
    return NextResponse.json(
      { error: 'Failed to get time information' },
      { status: 500 }
    );
  }
} 