import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'; // Import Zod

// Define Zod schema for the CSP report structure
const CspReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string().url().optional(),
    'referrer': z.string().optional(),
    'violated-directive': z.string().optional(),
    'effective-directive': z.string().optional(),
    'original-policy': z.string().optional(),
    'blocked-uri': z.string().optional(), // Can be URL or 'inline', 'eval', etc.
    'status-code': z.number().optional(),
    'source-file': z.string().optional(),
    'line-number': z.number().optional(),
    'column-number': z.number().optional(),
  }).passthrough(), // Allow other fields
});

// Enhanced CSP violation report logger with structured logging
export async function POST(request: NextRequest) {
  try {
    let report;
    try {
      const rawBody = await request.json();
      const validationResult = CspReportSchema.safeParse(rawBody);
      if (!validationResult.success) {
        console.warn('Invalid CSP report structure received:', validationResult.error.format());
        // Still return 204 as per spec, but log the invalid structure
        return new NextResponse(null, { status: 204 });
      }
      report = validationResult.data;
    } catch (parseError) {
      console.error('Error parsing CSP report JSON:', parseError);
      // Return 204 even if parsing fails
      return new NextResponse(null, { status: 204 });
    }
    
    // Extract client information for more context
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Create structured log entry
    const logEntry = {
      type: 'csp_violation',
      timestamp: new Date().toISOString(),
      client: {
        ip: clientIp,
        userAgent,
        referer
      },
      report: report
    };
    
    // Log in structured format
    console.warn('CSP Violation:', JSON.stringify(logEntry, null, 2));
    
    // TODO: In production, send to a monitoring service
    // Examples of services to consider:
    // - Vercel Analytics
    // - Sentry
    // - Datadog
    // - New Relic
    // - Custom logging endpoint
  } catch (error) {
    console.error('Error processing CSP report:', error);
  }

  // Always return 204 No Content for CSP reports
  return new NextResponse(null, { 
    status: 204,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Security-Policy': "default-src 'none'",
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

// Optional: Handle GET requests if needed, otherwise they default to 405 Method Not Allowed
// export async function GET() {
//   return NextResponse.json({ message: 'CSP reporting endpoint. Use POST to submit reports.' });
// }
