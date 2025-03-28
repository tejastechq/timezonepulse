import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { isValidTimezone } from '@/lib/utils/timezone';

const MAX_TIMEZONE_LENGTH = 100;  // Reasonable max length for a timezone string

/**
 * GET handler for the time API
 * Returns the current time for a specific timezone
 * 
 * @param request The incoming request
 * @returns Response with the current time information
 */
export async function GET(request: NextRequest) {
  try {
    // Get and sanitize the timezone from query parameters
    const searchParams = request.nextUrl.searchParams;
    const timezone = searchParams.get('timezone')?.trim() || 'UTC';

    // Validate timezone length
    if (!timezone || timezone.length > MAX_TIMEZONE_LENGTH) {
      return NextResponse.json(
        { error: 'Invalid timezone parameter' },
        { status: 400 }
      );
    }

    // Validate timezone format and existence
    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone identifier' },
        { status: 400 }
      );
    }

    // Get the current time in the specified timezone
    const now = DateTime.now().setZone(timezone);
    
    // Validate that DateTime parsing succeeded
    if (!now.isValid) {
      return NextResponse.json(
        { error: 'Failed to parse timezone', details: now.invalidReason },
        { status: 400 }
      );
    }

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

    // Return the time information with cache control headers
    return NextResponse.json(timeInfo, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error getting time:', error);
    return NextResponse.json(
      { error: 'Internal server error' },  // Don't expose internal error details
      { status: 500 }
    );
  }
}