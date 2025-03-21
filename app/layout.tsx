import './globals.css';
import { baseMetadata, viewport } from './metadata';
import { inter, robotoMono } from './font';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import GlassmorphismAnimation from '@/components/GlassmorphismAnimation';

// Export metadata and viewport configurations
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
      className={`${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${inter.className}`}>
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
          <GlassmorphismAnimation />
        </Providers>
      </body>
    </html>
  );
} 