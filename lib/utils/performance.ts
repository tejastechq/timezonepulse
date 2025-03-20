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

import { useEffect } from 'react';

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
 * Report web vitals to analytics
 */
export function reportWebVitalsToAnalytics(metric: WebVitalMetric): void {
  // Log in development, send to analytics in production
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital: ${metric.name}`, metric);
  } else {
    // In production, send to your analytics platform
    // Example of sending to an analytics endpoint
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      // Use keepalive to ensure the request completes even during page navigation
      keepalive: true,
    }).catch(err => {
      // Silent fail for analytics
      console.error('Failed to report web vital:', err);
    });
    
    // Report to console for debugging production issues
    if (metric.name === 'LCP') {
      console.log(`LCP: ${Math.round(metric.value)}`);
    }
  }
}

/**
 * Hook to measure and report web vitals
 */
export function useWebVitalsReport(): void {
  useEffect(() => {
    async function reportWebVitals() {
      const { onCLS, onFID, onLCP, onTTFB, onFCP, onINP } = await import('web-vitals');
      
      onCLS(metric => reportWebVitalsToAnalytics({ 
        name: 'CLS', 
        value: metric.value, 
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating
      }));
      
      onFID(metric => reportWebVitalsToAnalytics({ 
        name: 'FID', 
        value: metric.value, 
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating
      }));
      
      onLCP(metric => reportWebVitalsToAnalytics({ 
        name: 'LCP', 
        value: metric.value, 
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating
      }));
      
      onTTFB(metric => reportWebVitalsToAnalytics({ 
        name: 'TTFB', 
        value: metric.value, 
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating
      }));
      
      onFCP(metric => reportWebVitalsToAnalytics({ 
        name: 'FCP', 
        value: metric.value, 
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating
      }));
      
      // Add INP monitoring (Interaction to Next Paint)
      onINP(metric => reportWebVitalsToAnalytics({ 
        name: 'INP', 
        value: metric.value, 
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating
      }));
    }
    
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