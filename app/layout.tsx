import './globals.css';
import { baseMetadata, viewport } from './metadata';
import { inter, getFontVariables } from './font';
import ClientBoundary from '@/components/layout/ClientBoundary';
import Script from 'next/script';

// Export metadata properly as server component
export const metadata = baseMetadata;
export { viewport };

/**
 * Root layout component that wraps the entire application
 * This is a server component that handles metadata and core structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className="light"
      // Add data attributes to match client-side script in optimization.js
      // This fixes hydration mismatch errors
      data-prefers-reduced-motion="true"
      data-fonts-loaded="true"
    >
      <head>
        {/* No need for font preconnect or stylesheet links - Next.js font system handles this */}
        {/* The inter and robotoMono imports from ./font.ts handle the font loading */}
        
        {/* Use prefetch with high priority for critical resources */}
        <link 
          rel="preload" 
          href="/images/clock-face.svg" 
          as="image" 
          type="image/svg+xml"
          fetchPriority="high"
        />
        
        {/* Add priority hints script to optimize LCP */}
        <Script
          src="/scripts/priority-hints.js"
          strategy="beforeInteractive"
          id="priority-hints"
        />
        
        {/* Add the polyfill script with the highest priority (before any other scripts) */}
        <Script
          src="/scripts/polyfills.js"
          strategy="beforeInteractive"
          id="browser-polyfills"
        />
        
        {/* Add optimization script before any other scripts */}
        <Script
          src="/scripts/optimization.js"
          strategy="beforeInteractive"
          id="performance-optimization"
        />

        {/* Add font loading script */}
        <Script id="font-loading-strategy">
          {`
            // Set font display strategy
            (function() {
              // Mark font loading completed
              if ('fonts' in document) {
                document.fonts.ready.then(function() {
                  document.documentElement.dataset.fontsLoaded = 'true';
                });
              }
            })();
          `}
        </Script>
      </head>
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${inter.className} ${getFontVariables()}`}>
        {/* Use ClientBoundary as a proper client/server boundary */}
        <ClientBoundary>{children}</ClientBoundary>
      </body>
    </html>
  );
} 