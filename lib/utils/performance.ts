'use client';

/**
 * Core Web Vitals monitoring and optimization utilities
 * 
 * This module provides tools for measuring and optimizing:
 * - LCP (Largest Contentful Paint): How quickly main content becomes visible
 * - FID (First Input Delay): How quickly the page responds to interactions
 * - CLS (Cumulative Layout Shift): Visual stability during page loading
 * - INP (Interaction to Next Paint): Responsiveness to user interactions
 * - TTFB (Time to First Byte): Initial server response time
 * - FCP (First Contentful Paint): When first content is painted
 */

import { useEffect, useCallback } from 'react';

// Types for web vitals metrics
export type MetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';

export interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Interface for core web vitals metrics reporting
 */
interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
}

/**
 * Send web vitals data to analytics
 * 
 * @param metric - Web vitals metric to report
 */
const reportWebVitalsToAnalytics = (metric: { 
  name: string;
  id: string;
  value: number;
}) => {
  // Only report in production to avoid noise during development
  if (process.env.NODE_ENV !== 'production') return;
  
  // Check for analytics availability
  if (window && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', metric.name, {
      event_category: 'web-vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // If Sentry is available, report there too
  try {
    if (window && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(`WebVitals: ${metric.name} - ${Math.round(metric.value)}`);
    }
  } catch (error) {
    console.error('Failed to report to Sentry:', error);
  }
};

/**
 * Hook to collect and report web vitals metrics
 */
export function useWebVitals() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    async function reportWebVitals() {
      try {
        const { onCLS, onFID, onLCP, onTTFB, onFCP, onINP } = await import('web-vitals');
        
        onCLS(metric => reportWebVitalsToAnalytics({ 
          name: 'CLS', 
          id: metric.id, 
          value: metric.value 
        }));
        
        onFID(metric => reportWebVitalsToAnalytics({ 
          name: 'FID', 
          id: metric.id, 
          value: metric.value 
        }));
        
        onLCP(metric => reportWebVitalsToAnalytics({ 
          name: 'LCP', 
          id: metric.id, 
          value: metric.value 
        }));
        
        onTTFB(metric => reportWebVitalsToAnalytics({ 
          name: 'TTFB', 
          id: metric.id, 
          value: metric.value 
        }));
        
        onFCP(metric => reportWebVitalsToAnalytics({ 
          name: 'FCP', 
          id: metric.id, 
          value: metric.value 
        }));
        
        onINP(metric => reportWebVitalsToAnalytics({ 
          name: 'INP', 
          id: metric.id, 
          value: metric.value 
        }));
      } catch (error) {
        console.error('Error loading web-vitals:', error);
      }
    }

    // Call the async function
    reportWebVitals();
  }, []);
}

/**
 * Preload critical assets for faster LCP
 */
export function preloadCriticalAssets() {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // Use requestIdleCallback to defer non-critical work
  const requestIdleCallback = 
    window.requestIdleCallback || 
    ((cb) => setTimeout(cb, 1));
  
  requestIdleCallback(() => {
    // Prefetch critical images instead of preloading them
    // This avoids warnings when resources aren't used immediately
    const imagesToLoad = [
      { path: '/images/clock-face.svg', type: 'image/svg+xml', as: 'image' }
    ];
    
    // Add prefetch links for resources that may be needed later
    imagesToLoad.forEach(image => {
      // Use prefetch instead of preload to avoid warnings
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = image.as;
      link.href = image.path;
      link.type = image.type;
      document.head.appendChild(link);
    });
  });
}

/**
 * Optimize layout stability by reserving space for dynamic content
 * @param element The element to optimize
 * @param defaultHeight Default height to reserve in pixels
 */
export function optimizeLayoutStability(element: HTMLElement | null, defaultHeight: number): void {
  if (!element) return;
  
  // Set content-visibility to improve rendering performance
  element.style.contentVisibility = 'auto';
  
  // Set min-height to prevent layout shifts when content loads
  element.style.minHeight = `${defaultHeight}px`;
  
  // Add contain-intrinsic-size for better size estimation
  element.style.containIntrinsicSize = `0 ${defaultHeight}px`;
}

/**
 * Prioritize important LCP candidates for faster rendering
 * @param elementId ID of the LCP candidate element
 */
export function prioritizeLCP(elementId: string): void {
  if (typeof window === 'undefined') return;
  
  // Mark this element as an LCP candidate for priority
  const element = document.getElementById(elementId);
  if (element) {
    // Set fetchpriority for browsers that support it
    if ('loading' in HTMLImageElement.prototype) {
      element.setAttribute('fetchpriority', 'high');
    }
    
    // Add importance attribute for older browsers
    element.setAttribute('importance', 'high');
  }
} 