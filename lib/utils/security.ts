/**
 * Utilities for security-related functionality using Web Crypto API
 */

/**
 * Vercel analytics domains for CSP
 */
const vercelAnalyticsDomains = [
  'https://va.vercel-analytics.com',
  'https://vitals.vercel-insights.com',
];

/**
 * Statuspage domains for CSP
 */
const statuspageDomains = [
  'https://timezonepulse1.statuspage.io',
  'https://*.statuspage.io'
];

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
 * Get Content Security Policy with nonce
 * 
 * Simplified for Next.js compatibility:
 * - In development: Uses strict CSP with nonce
 * - In production: More permissive to work with Next.js dynamic content
 */
export function getCspWithNonce(nonce: string, hostname: string = ''): string {
  // Common script sources between environments
  const commonScriptSrc = [
    `'nonce-${nonce}'`,
    ...vercelAnalyticsDomains,
    ...statuspageDomains,
    'https://plausible.io',
    'https://status.useanvil.com',
    'https://vercel.live',
  ];

  // For production environments (including Vercel previews treated as production NODE_ENV)
  if (process.env.NODE_ENV === 'production') {
    // Use 'unsafe-inline' for scripts in production/preview to avoid hash/nonce issues
    // This is less secure but more practical if hashes change frequently.
    // IMPORTANT: 'unsafe-inline' is ignored if nonces or hashes are present, so we remove the nonce source here.
    const prodScriptSrcElements = [
      `'self'`,
      // Filter out the nonce from commonScriptSrc for this policy
      ...commonScriptSrc.filter(src => !src.startsWith("'nonce-")),
      `'unsafe-inline'`, // Allow all inline scripts
      hostname ? `https://${hostname}` : '',
    ].filter(Boolean);
    console.log("Using Production/Preview CSP with unsafe-inline (nonce removed)"); // Log policy type

    const prodScriptSrc = prodScriptSrcElements.join(' ');

    const prodConnectSrc = [
      `'self'`,
      ...vercelAnalyticsDomains,
      'https://plausible.io',
      'https://status.useanvil.com',
      hostname ? `https://${hostname}` : '', // Add the app's own domain
    ].filter(Boolean);

    const prodFrameSrc = [
      `'self'`,
      ...statuspageDomains,
      'https://vercel.live',
      'https://*.vercel.live', // Keep Vercel Live for preview comments etc. Consider tightening if not needed.
    ];

    return [
      `default-src 'self'`,
      `script-src ${prodScriptSrc}`, // Use the already joined string directly
      `style-src 'self' 'unsafe-inline'`, // Keep unsafe-inline for styles as Next.js might need it
      `img-src 'self' data: blob: https://*`, // Keep img-src permissive for now, consider tightening if needed
      `font-src 'self' data: https://fonts.gstatic.com`,
      `connect-src ${prodConnectSrc.join(' ')}`,
      `frame-src ${prodFrameSrc.join(' ')}`,
      `form-action 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
      `frame-ancestors 'none'`
    ].join('; ');
  }

  // Development can maintain the stricter nonce-based approach
  const scriptSrc = [
    ...commonScriptSrc,
    `'strict-dynamic'`, 
    `'unsafe-eval'` // Needed for React Fast Refresh in development
  ];

  // Define CSP directives for development
  const directives = {
    'default-src': [`'self'`],
    'script-src': scriptSrc,
    'style-src': [`'self'`, `'unsafe-inline'`], // Next.js requires unsafe-inline for styles
    'img-src': [`'self'`, 'data:', 'blob:', 'https://*'],
    'font-src': [`'self'`, 'data:', 'https://fonts.gstatic.com'],
    'connect-src': [
      `'self'`,
      ...vercelAnalyticsDomains,
      'https://plausible.io',
      'https://status.useanvil.com',
      'https://*.vercel.app',
      'https://*.vercel.com',
      hostname ? `https://${hostname}` : '',
    ].filter(Boolean),
    'frame-src': [`'self'`, ...statuspageDomains, 'https://vercel.live', 'https://*.vercel.live'],
    'form-action': [`'self'`],
    'base-uri': [`'self'`],
    'object-src': [`'none'`],
    'frame-ancestors': [`'none'`],
  };

  // Build policy string
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
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

/**
 * Get default security headers that don't require a nonce
 */
export function getDefaultSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'off',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };

  // Add production-specific headers
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    headers['Expect-CT'] = 'enforce, max-age=86400';
    headers['Access-Control-Allow-Origin'] = process.env.NEXT_PUBLIC_APP_URL || '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}
