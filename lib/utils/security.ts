/**
 * Utilities for security-related functionality using Web Crypto API
 */

/**
 * Generates a cryptographically secure nonce for CSP using Web Crypto API
 * @returns A base64 encoded nonce string
 */
export function generateNonce(): string {
  // Use the Web Crypto API which is available in both Edge and Node.js environments
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, Array.from(arr)));
}

/**
 * Creates CSP header value with nonce
 * @param nonce The nonce to include in the CSP
 * @returns CSP header value string
 */
export function getCspWithNonce(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statuspageDomains = 'https://*.statuspage.io https://timezonepulse1.statuspage.io';
  const vercelAnalyticsDomains = 'https://va.vercel-analytics.com https://vitals.vercel-insights.com';

  // Strict CSP for scripts using nonce and strict-dynamic
  // In development, 'unsafe-eval' might be needed for some tooling (e.g., React DevTools). Keep it conditional.
  const scriptSrcDirective = isDevelopment
    ? `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' ${statuspageDomains} ${vercelAnalyticsDomains} 'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=' 'sha256-jtvmQnrAHWmd1jHWy+cly+VqFdS46YJFOH8oAwXT5iM=' 'sha256-zvVpoXGvl1JeT7sZGX5JGm+ali5OPDA0WgVtcj5r7ws='`
    : `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic' ${statuspageDomains} ${vercelAnalyticsDomains} 'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=' 'sha256-jtvmQnrAHWmd1jHWy+cly+VqFdS46YJFOH8oAwXT5iM=' 'sha256-zvVpoXGvl1JeT7sZGX5JGm+ali5OPDA0WgVtcj5r7ws='`;

  // In development, we need to be more permissive with trusted types
  const trustedTypesDirective = isDevelopment
    ? `trusted-types 'allow-duplicates' default dompurify nextjs#bundler webpack#bundler`
    : `trusted-types 'allow-duplicates' default dompurify webpack#bundler nextjs#bundler`;

  // Base URI restriction
  const baseUri = `base-uri 'self'`;

  // Object security
  const objectSrc = `object-src 'none'`;

  // Frame security - allow frames for embedded content and Statuspage
  const frameSrc = `frame-src 'self' https: ${statuspageDomains}`;
  const frameAncestors = `frame-ancestors 'self'`;
  const formAction = `form-action 'self'`;

  // Media and font security
  const mediaSrc = `media-src 'self'`;
  // Allow self-hosted fonts and data URIs. Add specific CDNs if needed.
  const fontSrc = `font-src 'self' data:`;

  // Image security with strict sources, allow Statuspage images, data, blobs, and localhost in dev
  const imgSrc = `img-src 'self' data: blob: ${statuspageDomains} ${isDevelopment ? 'http://localhost:* http://127.0.0.1:*' : ''}`;

  // Style security - Remove 'unsafe-inline'. If needed, use hashes or nonces for specific inline styles.
  // Allow Statuspage styles.
  const styleSrc = `style-src 'self' 'unsafe-inline' ${statuspageDomains}`;

  // Connect sources including development needs, Vercel Analytics, and Statuspage
  const connectSrc = isDevelopment
    ? `connect-src 'self' ${vercelAnalyticsDomains} https://*.vercel.com ws: http://localhost:* http://127.0.0.1:* ${statuspageDomains}`
    : `connect-src 'self' ${vercelAnalyticsDomains} https://*.vercel.com ${statuspageDomains}`;

  // Manifest security
  const manifestSrc = `manifest-src 'self'`;

  // Reporting directive
  const reportUri = `report-uri /api/csp-report`;

  // Create a single-line CSP with proper spacing between directives
  const directives = [
    `default-src 'self'`,
    scriptSrcDirective,
    styleSrc,
    imgSrc,
    fontSrc,
    connectSrc,
    mediaSrc,
    manifestSrc,
    baseUri,
    objectSrc,
    frameSrc,
    frameAncestors,
    formAction,
    trustedTypesDirective,
    reportUri // Add the reporting directive
  ];

  // Join all directives with semicolons and proper spacing
  return directives.join('; ');
}

/**
 * Validates if a given string is a valid base64 nonce
 * @param nonce The nonce string to validate
 * @returns boolean indicating if the nonce is valid
 */
export function isValidNonce(nonce: string): boolean {
  if (!nonce || typeof nonce !== 'string') return false;
  // Check if it's a valid base64 string of correct length (24 characters for 16 bytes)
  return /^[A-Za-z0-9+/]{24}$/.test(nonce);
}

/**
 * Creates a secure hash using Web Crypto API
 * @param input String to hash
 * @returns Promise that resolves to hex-encoded hash
 */
export async function createSecureHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
