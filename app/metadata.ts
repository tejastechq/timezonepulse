import { Metadata, Viewport } from 'next';

const APP_NAME = 'TimeZonePulse'; // Corrected casing
const APP_DEFAULT_TITLE = 'TimeZonePulse: Your Global Time Companion';
const APP_TITLE_TEMPLATE = '%s - TimeZonePulse';
const APP_DESCRIPTION = 'Effortlessly track, compare, and convert time across multiple timezones with TimeZonePulse. Stay synchronized with the world, whether for work or travel.';

/**
 * Default metadata configuration for the TimeZonePulse application
 * This can be overridden in individual pages
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL('https://www.timezonepulse.com'), // Assuming this URL is correct for TimeZonePulse
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME, // Uses the updated constant
  authors: [{ name: 'TimeZonePulse Team' }],
  generator: 'Next.js',
  keywords: ['timezone', 'time converter', 'global time', 'international clock', 'time management', 'meeting planner', 'travel time', 'timezonepulse'], // Removed 'world clock'
  referrer: 'origin-when-cross-origin',
  creator: 'TimeZonePulse Team',
  publisher: 'TimeZonePulse Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'productivity',
  
  openGraph: {
    type: 'website',
    siteName: APP_NAME, // Uses the updated constant
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: [{
      url: 'https://www.timezonepulse.com/timezonepulse.png', // Updated to full URL
      width: 1200,
      height: 630,
      alt: 'TimeZonePulse App Logo', // Alt text already correct
    }],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: ['/twitter.PNG'], // Using twitter.PNG from public folder
    creator: '@timezonepulse', // Handle seems correct
  },
  // Now using app route /manifest.ts instead of static file
  // manifest: '/manifest.json',
  
  icons: {
    icon: '/timezonepulse.png', // Simplified icon reference
    apple: '/timezonepulse.png', // Simplified apple icon reference
  },
  
  verification: {
    google: 'QlTpR2EmL9cag8Vpd2_iJLCeldIlPOTWs--8r_-4Oe0', // Added Google verification code
  },
  
  alternates: {
    canonical: 'https://www.timezonepulse.com', // URL seems correct
    languages: {
      'en-US': 'https://www.timezonepulse.com', // URL seems correct
    },
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Default viewport configuration
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};
