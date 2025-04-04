import { validateEnv } from '@/lib/utils/env';

// Validate environment variables at startup
const envValidation = validateEnv();
if (!envValidation.success) {
  console.error('Application startup failed:', envValidation.error);
  // In production, we might want to show a maintenance page instead of crashing
  if (process.env.NODE_ENV === 'production') {
    // Log to error reporting service but continue
    console.error('Critical: Invalid environment configuration in production');
  }
}

import './globals.css';
import { baseMetadata, viewport } from './metadata';
import { inter, robotoMono, poppins, montserrat, oswald } from './font'; // Import oswald
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import GlassmorphismAnimation from '@/components/GlassmorphismAnimation';
import '@/lib/utils/trusted-types'; // Import trusted-types configuration
import { Inter, Roboto_Mono, Poppins, Montserrat, Oswald } from 'next/font/google';
import Script from 'next/script';

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
      // Add the oswald variable here
      className={`${inter.variable} ${robotoMono.variable} ${poppins.variable} ${montserrat.variable} ${oswald.variable}`}
      suppressHydrationWarning
    >
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${inter.className}`}>
        <Providers>
          <div className="relative flex min-h-screen"> {/* Flex container, added relative for potential absolute positioning inside */}
            <main className="flex-grow"> {/* Removed pl-20 */}
              {children}
              {fonts}
            </main>
          </div>
          <Analytics 
            mode={process.env.NODE_ENV === 'production' ? 'production' : 'development'}
            debug={process.env.NODE_ENV !== 'production'}
          />
          <SpeedInsights />
          <GlassmorphismAnimation />

          {/* Footer Section - Removed pl-20 */}
          <footer className="w-full mt-auto py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            © {new Date().getFullYear()} TimezonePulse. All rights reserved. |{' '}
            <a href="/" className="hover:underline">
              Home
            </a>{' '}
            |{' '}
            <a href="/about" className="hover:underline">
              About
            </a>{' '}
            |{' '}
            <a href="https://timezonepulse1.statuspage.io" target="_blank" rel="noopener noreferrer" className="hover:underline">
              System Status
            </a>
          </footer>
        </Providers>
        {/* TODO: Implement Statuspage.io embed properly or remove if not needed. 
             Currently disabled as it might not be fully integrated or styled correctly.
        <Script src="https://timezonepulse1.statuspage.io/embed/script.js" strategy="afterInteractive" /> 
        */}
      </body>
    </html>
  );
}
