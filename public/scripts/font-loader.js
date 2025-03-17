/**
 * Custom font loader script optimized for performance
 * 
 * This script helps reduce layout shifts (CLS) during font loading
 * by implementing font loading strategies.
 */

(function() {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Check if fonts are already loaded
  if (sessionStorage.fontsLoaded) {
    document.documentElement.classList.add('fonts-loaded');
    return;
  }

  // Function to check if a font is loaded
  function checkFontLoaded(fontFamily) {
    return new Promise((resolve) => {
      if ('FontFace' in window) {
        // Modern browsers - use FontFace API
        document.fonts.ready.then(() => {
          const loaded = document.fonts.check(`1em ${fontFamily}`);
          resolve(loaded);
        });
      } else {
        // Fallback for older browsers
        resolve(true);
      }
    });
  }

  // Add a class to body when fonts are loaded to prevent layout shifts
  Promise.all([
    checkFontLoaded('Inter'),
    checkFontLoaded('Roboto Mono')
  ]).then((results) => {
    if (results.every(Boolean)) {
      document.documentElement.classList.add('fonts-loaded');
      // Cache font loaded state for session
      try {
        sessionStorage.fontsLoaded = true;
      } catch (e) {
        // Ignore errors (e.g. private browsing mode)
      }
      
      // Track performance for font loading
      if (window.performance && window.performance.mark) {
        performance.mark('fonts-loaded');
        
        // Create performance measure if navigation timing is available
        if (performance.getEntriesByType && performance.getEntriesByType('navigation').length) {
          const navEntry = performance.getEntriesByType('navigation')[0];
          performance.measure(
            'fonts-loading-time', 
            {
              start: navEntry.startTime,
              end: performance.getEntriesByName('fonts-loaded')[0].startTime
            }
          );
        }
      }
    }
  }).catch(() => {
    // If font loading fails, still allow the site to display with fallback fonts
    document.documentElement.classList.add('fonts-failed');
  });
})(); 