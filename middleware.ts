import { NextRequest, NextResponse } from "next/server";
import { getCspWithNonce, getDefaultSecurityHeaders, generateNonce } from "./lib/utils/security";

/**
 * Dummy rate limiter for edge compatibility
 * This is a placeholder that always allows requests
 */
const dummyRateLimiter = {
  limit: async () => ({ success: true, reset: 0 }),
};

/**
 * Middleware function for Next.js
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block suspicious paths early
  const blockedPatterns = [
      /^\/cmd_/,        // Paths starting with /cmd_
      /\/\.env/,        // Paths containing /.env
      /\/admin$/,       // Paths ending with /admin
      /\/\.git/,        // Paths containing /.git
      /\/node_modules/, // Paths containing /node_modules
      /\/package\.json/, // Paths containing /package.json
      /\/tsconfig\.json/, // Paths containing /tsconfig.json
  ];
  if (blockedPatterns.some((pattern) => pattern.test(pathname))) {
    console.warn(`Blocked suspicious path access attempt: ${pathname}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Redirect /mobilev2 and /list-view routes to the homepage (already handled)
  // if (pathname.startsWith('/mobilev2') || pathname.startsWith('/list-view')) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  // --- Block development/test pages and specific routes in production ---
  if (process.env.NODE_ENV === 'production') {
    const blockedProductionPaths = [
      '/grid-test',
      '/list-view',
      '/mobilev2',
      '/settings',
    ];
    if (blockedProductionPaths.some(path => pathname.startsWith(path))) {
      console.warn(`Attempted access to blocked page '${pathname}' in production. Redirecting.`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  // --- End blocking pages ---


  // Generate a secure nonce value for CSP
  const nonce = generateNonce();
  
  // Prepare the response with basic headers
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Apply standard security headers
  Object.entries(getDefaultSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Set the CSP header with the generated nonce
  response.headers.set(
    "Content-Security-Policy",
    getCspWithNonce(nonce, request.nextUrl.hostname)
  );

  // Set the nonce in a cookie for the Document component to use
  // Extract domain for cookie
  const domain = request.nextUrl.hostname !== 'localhost' 
    ? `Domain=${request.nextUrl.hostname}; ` 
    : '';
  
  // Set the cookie with the nonce
  response.headers.set(
    "Set-Cookie",
    `nonce=${nonce}; Path=/; ${domain}${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`
  );

  // Simple rate limiting - always succeeds in this implementation
  try {
    const limiter = dummyRateLimiter;
    const result = await limiter.limit();
    
    if (!result.success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": result.reset.toString(),
        },
      });
    }
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Continue processing even if rate limiting fails
  }

  // --- Log attempts to access potentially undefined routes ---
  // Define known valid route prefixes/patterns (adjust as needed)
  const knownRoutePatterns = [
    /^\/$/,             // Homepage
    /^\/about/,
    /^\/settings/,
    /^\/grid-test/,
    /^\/home/,          // Though it redirects
    /^\/api\//,         // API routes
    // The matcher already excludes static assets like /_next/static, /_next/image, /favicon.ico etc.
    // Redirected routes (/mobilev2, /list-view) are handled earlier.
  ];

  // Check if the current path matches any known patterns
  const isKnownRoute = knownRoutePatterns.some(pattern => pattern.test(pathname));

  if (!isKnownRoute) {
    // It's not a blocked pattern (checked earlier) and not a known route
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.warn(`Potential access attempt to undefined route: ${pathname} from IP: ${clientIp}`);
  }
  // --- End logging ---


  return response;
}

export const config = {
  matcher: "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
};
