/**
 * Font optimization module
 * 
 * This module handles optimized font loading to improve LCP performance
 * by using the Next.js Font system for optimal font loading
 */

import { Inter, Roboto_Mono } from 'next/font/google';

/**
 * Load Inter font with subsets and display swap for faster rendering
 * Optimizes LCP by loading font efficiently
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
  preload: true,  // Ensures Next.js handles preloading correctly
  adjustFontFallback: true, // Reduces CLS
});

/**
 * Load Roboto Mono font for code and time displays
 * Proportional width for better time display
 */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
  fallback: ['monospace'],
  preload: true,  // Ensures Next.js handles preloading correctly
  adjustFontFallback: true, // Reduces CLS
});

/**
 * Get all font variables to use in className
 */
export function getFontVariables() {
  return `${inter.variable} ${robotoMono.variable}`;
} 