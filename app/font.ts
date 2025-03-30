/**
 * Font optimization module
 * 
 * This module handles optimized font loading to improve LCP performance
 * by using the Next.js Font system for optimal font loading
 */

import { Inter, Roboto_Mono, Poppins, Montserrat, Oswald } from 'next/font/google'; // Added Oswald

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

/**
 * Load Poppins font for headlines and potentially other UI elements
 */
export const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins', // CSS variable name
  weight: ['400', '700', '800'], // Added regular, bold, extrabold weights
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
});

/**
 * Load Oswald font for headings
 */
export const oswald = Oswald({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-oswald', // CSS variable name
  weight: ['400', '600', '700'], // Added regular, semibold, bold weights
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
});

/**
 * Load Montserrat font for headings
 */
export const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat', // CSS variable name
  weight: ['400', '700', '800'], // Added regular, bold, extrabold weights
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
});
