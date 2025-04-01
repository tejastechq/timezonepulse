import { NextRequest, NextResponse } from 'next/server';

// Simple CSP violation report logger
// In a production environment, you might want to send these reports to a dedicated logging service.
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    console.warn('CSP Violation Report:', JSON.stringify(report, null, 2));
    // Optionally, send to a logging service here
  } catch (error) {
    console.error('Error processing CSP report:', error);
    // Still return 204 even if parsing fails, as the browser doesn't need a detailed response
  }

  // Always return 204 No Content for CSP reports
  return new NextResponse(null, { status: 204 });
}

// Optional: Handle GET requests if needed, otherwise they default to 405 Method Not Allowed
// export async function GET() {
//   return NextResponse.json({ message: 'CSP reporting endpoint. Use POST to submit reports.' });
// }
