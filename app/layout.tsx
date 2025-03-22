import './globals.css';
import { baseMetadata, viewport } from './metadata';
import { inter, robotoMono } from './font';
import { Providers } from './providers';
import Script from 'next/script';
import ClientComponents from '@/components/ClientComponents';
import ClientAnalytics from '@/components/analytics/ClientAnalytics';

// Export metadata and viewport configurations
export const metadata = baseMetadata;
export { viewport };

/**
 * Root layout component that wraps the entire application
 * This is a server component that handles metadata and core structure
 */
export default function RootLayout({
  children,
  fonts = null,
}: Readonly<{
  children: React.ReactNode;
  fonts: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline critical CSS optimization script - minimized */}
        <Script 
          id="preload-critical" 
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.style.setProperty('--main-heading-visibility','visible');`
          }}
        />
      </head>
      
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${inter.className}`}>
        <Providers>
          {children}
          {fonts}
          
          {/* Script loading moved to bottom of body and handled separately */}
          <ClientComponents />
          
          {/* Load analytics with client-only component */}
          <ClientAnalytics />
        </Providers>
        
        {/* Scripts moved outside of React rendering tree to prevent hydration issues */}
        <Script 
          src="/scripts/bfcache-helper.js"
          strategy="afterInteractive"
          id="bfcache-helper"
        />
        
        <Script 
          src="/scripts/module-preload.js"
          strategy="afterInteractive"
          id="module-preload"
        />
        
        <Script
          src="/scripts/main-thread-optimization.js"
          strategy="afterInteractive"
          id="main-thread-optimization"
        />
      </body>
    </html>
  );
} 