import { Metadata, Viewport } from 'next';

const APP_NAME = 'TimezonePulse';
const APP_DEFAULT_TITLE = 'TimezonePulse: Your Global Time Companion';
const APP_TITLE_TEMPLATE = '%s - TimezonePulse';
const APP_DESCRIPTION = 'Effortlessly track, compare, and convert time across multiple timezones with TimezonePulse. Stay synchronized with the world, whether for work or travel.';

/**
 * Default metadata configuration for the TimezonePulse application
 * This can be overridden in individual pages
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL('https://www.timezonepulse.com'),
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: 'TimezonePulse Team' }],
  generator: 'Next.js',
  keywords: ['timezone', 'world clock', 'time converter', 'global time', 'international clock', 'time management', 'meeting planner', 'travel time', 'timezonepulse'],
  referrer: 'origin-when-cross-origin',
  creator: 'TimezonePulse Team',
  publisher: 'TimezonePulse Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'productivity',
  
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: [{
      url: '/timezonepulse.png', // Updated path
      width: 1200, // Keep original dimensions or adjust if known
      height: 630,
      alt: 'TimezonePulse App Logo', // Updated alt text
    }],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: ['/timezonepulse.png'], // Updated path
    creator: '@timezonepulse', // Updated handle
  },
  // Now using app route /manifest.ts instead of static file
  // manifest: '/manifest.json',
  
  icons: {
    icon: '/timezonepulse.png', // Simplified icon reference
    apple: '/timezonepulse.png', // Simplified apple icon reference
  },
  
  // verification: { // Removed Google verification for now
  //   google: 'google-site-verification-code',
  // },
  
  alternates: {
    canonical: 'https://www.timezonepulse.com', // Updated canonical URL
    languages: {
      'en-US': 'https://www.timezonepulse.com', // Updated language alternate URL
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
