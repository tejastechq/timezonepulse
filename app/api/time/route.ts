import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { isValidTimezone } from '@/lib/utils/timezone';
import { authenticateApi, AuthType, secureApiHeaders } from '@/lib/utils/apiAuth';
import { z } from 'zod'; // Add Zod for request validation

const MAX_TIMEZONE_LENGTH = 100;  // Reasonable max length for a timezone string

// Validate timezone query parameter using Zod
const TimezoneSchema = z.object({
  timezone: z.string().max(MAX_TIMEZONE_LENGTH).optional(),
});

/**
 * GET handler for the time API
 * Returns the current time for a specific timezone
 * 
 * @param request The incoming request
 * @returns Response with the current time information
 */
export async function GET(request: NextRequest) {
  try {
    // Only apply rate limiting for this endpoint
    const authResponse = await authenticateApi({ type: AuthType.RATE_LIMITED });
    if (authResponse) return authResponse;
    
    // Get and sanitize the timezone from query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawTimezone = searchParams.get('timezone') || 'UTC';
    
    // Validate using Zod schema
    const result = TimezoneSchema.safeParse({ timezone: rawTimezone });
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid timezone parameter', details: result.error.format() },
        { status: 400, headers: secureApiHeaders }
      );
    }
    
    const timezone = result.data.timezone || 'UTC';

    // Validate timezone format and existence
    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone identifier' },
        { status: 400, headers: secureApiHeaders }
      );
    }

    // Get the current time in the specified timezone
    const now = DateTime.now().setZone(timezone);
    
    // Validate that DateTime parsing succeeded
    if (!now.isValid) {
      return NextResponse.json(
        { error: 'Failed to parse timezone', details: now.invalidReason },
        { status: 400, headers: secureApiHeaders }
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

    // Return the time information with security headers
    return NextResponse.json(timeInfo, {
      headers: {
        ...secureApiHeaders,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error getting time:', error);
    return NextResponse.json(
      { error: 'Internal server error' },  // Don't expose internal error details
      { status: 500, headers: secureApiHeaders }
    );
  }
}