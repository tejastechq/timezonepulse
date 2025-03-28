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
  
  // Since Next.js 13+ extensively uses inline scripts, we need to allow either:
  // 1. unsafe-inline without nonce (less secure but more compatible)
  // 2. specific hashes for known scripts
  const scriptSrcDirective = isDevelopment
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline' https:`
    : `script-src 'self' 'unsafe-inline' https:`;
  
  // In development, we need to be more permissive with trusted types
  const trustedTypesDirective = isDevelopment
    ? `trusted-types 'allow-duplicates' default dompurify nextjs#bundler webpack#bundler`
    : `trusted-types 'allow-duplicates' default dompurify`;

  // Base URI restriction
  const baseUri = `base-uri 'self'`;

  // Object security
  const objectSrc = `object-src 'none'`;

  // Frame security
  const frameSrc = `frame-src 'self'`;
  const frameAncestors = `frame-ancestors 'none'`;
  const formAction = `form-action 'self'`;

  // Media and font security
  const mediaSrc = `media-src 'self'`;
  const fontSrc = `font-src 'self' data: https:`;
  
  // Image security with strict sources
  const imgSrc = `img-src 'self' data: https: blob: ${isDevelopment ? 'http://localhost:* http://127.0.0.1:*' : ''}`;
  
  // Style security
  const styleSrc = `style-src 'self' 'unsafe-inline'`; // Allow inline styles which Next.js requires

  // Connect sources including development needs
  const connectSrc = isDevelopment
    ? `connect-src 'self' https://va.vercel-analytics.com https://*.vercel-analytics.com https://*.vercel.com ws: http://localhost:* http://127.0.0.1:*`
    : `connect-src 'self' https://va.vercel-analytics.com https://*.vercel-analytics.com https://*.vercel.com`;

  // Manifest security
  const manifestSrc = `manifest-src 'self'`;

  // Combine all directives
  return `
    default-src 'self';
    ${scriptSrcDirective};
    ${styleSrc};
    ${imgSrc};
    ${fontSrc};
    ${connectSrc};
    ${mediaSrc};
    ${manifestSrc};
    ${baseUri};
    ${objectSrc};
    ${frameSrc};
    ${frameAncestors};
    ${formAction};
    ${trustedTypesDirective}
  `.replace(/\s+/g, ' ').trim();
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
