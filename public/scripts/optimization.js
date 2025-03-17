/**
 * Performance optimization script
 * Improves LCP, CLS, and overall performance
 */
(function() {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Use data attribute for font loading instead of classes
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      // Use data attribute instead of class to avoid hydration mismatch
      document.documentElement.dataset.fontsLoaded = 'true';
    });
  }

  // Instead of adding a class directly, set a data attribute that CSS can use
  // This prevents hydration mismatches while still allowing reduced motion preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.dataset.prefersReducedMotion = 'true';
    // Do NOT manipulate the className directly to avoid hydration mismatches
  }

  // Store BFCache state to prevent unnecessary reloads
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      // Page was restored from BFCache
      document.documentElement.dataset.bfcacheRestored = 'true';
    }
  });

  // Set up layout stability monitoring
  if ('PerformanceObserver' in window) {
    try {
      // Monitor CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            // Log CLS values for debugging
            if (entry.value > 0.1) {
              console.warn('High CLS detected:', entry.value);
            }
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Monitor LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          // Log LCP for debugging
          console.log('LCP:', lastEntry.startTime);
          
          // Add a marker in dev tools for debugging
          if (window.performance && window.performance.mark) {
            window.performance.mark('lcp-detected');
          }
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // Fail silently if observers aren't supported
      console.error('Performance observers not supported:', e);
    }
  }

  // Preload visible images that might be part of LCP
  const preloadVisibleLCPCandidates = () => {
    const images = document.querySelectorAll('img:not([loading="lazy"])');
    const viewportHeight = window.innerHeight;
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      // If image is in viewport and not yet loaded
      if (rect.top < viewportHeight && !img.complete) {
        img.setAttribute('fetchpriority', 'high');
      }
    });
  };
  
  // Run once to optimize initial paint
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    preloadVisibleLCPCandidates();
  } else {
    window.addEventListener('DOMContentLoaded', preloadVisibleLCPCandidates);
  }
})(); 