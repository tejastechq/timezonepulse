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
  // Redirect /mobilev2 and /list-view routes to the homepage
  if (request.nextUrl.pathname.startsWith('/mobilev2') || request.nextUrl.pathname.startsWith('/list-view')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

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

  // // Set the CSP header with the generated nonce
  // response.headers.set(
  //   "Content-Security-Policy",
  //   getCspWithNonce(nonce, request.nextUrl.hostname)
  // );

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

  return response;
}

export const config = {
  matcher: "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
};
