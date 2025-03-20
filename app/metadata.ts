import { Metadata, Viewport } from 'next';

const APP_NAME = 'World Clock';
const APP_DEFAULT_TITLE = 'World Clock - Track Time Across Multiple Timezones';
const APP_TITLE_TEMPLATE = '%s - World Clock';
const APP_DESCRIPTION = 'Track and manage time across multiple timezones with our intuitive World Clock app. Perfect for remote teams and international scheduling.';

/**
 * Default metadata configuration for the World Clock application
 * This can be overridden in individual pages
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL('https://worldclock.app'),
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: 'World Clock Team' }],
  generator: 'Next.js',
  keywords: ['world clock', 'timezone converter', 'time management', 'international time', 'time zones'],
  referrer: 'origin-when-cross-origin',
  creator: 'World Clock Team',
  publisher: 'World Clock',
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
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'World Clock App',
    }],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@worldclockapp',
  },
  
  manifest: '/manifest.json',
  
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
      { url: '/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
    ],
  },
  
  verification: {
    google: 'google-site-verification-code',
  },
  
  alternates: {
    canonical: 'https://worldclock.app',
    languages: {
      'en-US': 'https://worldclock.app',
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