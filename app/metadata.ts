import { Metadata, Viewport } from 'next';

/**
 * Default metadata configuration for the World Clock application
 * This can be overridden in individual pages
 */
export const baseMetadata: Metadata = {
  title: {
    template: '%s | World Clock',
    default: 'World Clock - Global Time Management',
  },
  description: 'A sophisticated time management application for tracking and visualizing time across multiple global timezones.',
  keywords: ['world clock', 'timezone', 'time management', 'global time', 'international clock'],
  authors: [{ name: 'World Clock Team' }],
  creator: 'World Clock Team',
  publisher: 'World Clock',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://worldclock.app',
    title: 'World Clock - Global Time Management',
    description: 'Track and visualize time across multiple global timezones.',
    siteName: 'World Clock',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Clock - Global Time Management',
    description: 'Track and visualize time across multiple global timezones.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Default viewport configuration
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}; 