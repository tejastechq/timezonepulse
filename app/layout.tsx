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
import { inter, robotoMono } from './font';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import GlassmorphismAnimation from '@/components/GlassmorphismAnimation';
import DevInfo from '@/components/DevInfo';

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
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${inter.className}`}>
        <Providers>
          {children}
          {fonts}
          <Analytics />
          <SpeedInsights />
          <GlassmorphismAnimation />
          <DevInfo />
        </Providers>
      </body>
    </html>
  );
}