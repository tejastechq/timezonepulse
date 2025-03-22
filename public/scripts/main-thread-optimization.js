/**
 * Main Thread Optimization
 * 
 * This script helps optimize the main thread by:
 * 1. Deferring non-critical JavaScript
 * 2. Prioritizing critical resources
 * 3. Implementing smart resource loading strategies
 */
(function() {
  // Helper function for request idle callback polyfill
  window.requestIdleCallback = window.requestIdleCallback || 
    function(cb) {
      return setTimeout(function() {
        const start = Date.now();
        cb({
          didTimeout: false,
          timeRemaining: function() {
            return Math.max(0, 50 - (Date.now() - start));
          }
        });
      }, 1);
    };
  
  // Helper function to check if we have native support
  window.cancelIdleCallback = window.cancelIdleCallback || 
    function(id) {
      clearTimeout(id);
    };
  
  // Detect if user is on slow connection
  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;
  
  const isSlowConnection = connection && 
    (connection.saveData || 
     connection.effectiveType === 'slow-2g' || 
     connection.effectiveType === '2g' || 
     connection.effectiveType === '3g');
  
  // Store connection info for later use
  window.__connectionInfo = {
    isSlowConnection,
    effectiveType: connection ? connection.effectiveType : null,
    saveData: connection ? connection.saveData : false
  };
  
  // Function to defer loading of non-critical resources
  function deferNonCriticalResources() {
    // List of selectors for non-critical resources
    const nonCriticalSelectors = [
      'link[rel="preload"][as="script"]:not([data-critical="true"])',
      'script[data-defer="true"]',
      'link[rel="stylesheet"][data-defer="true"]',
      'img[loading="lazy"]'
    ];
    
    // Wait until page is loaded and main content is visible
    if (document.readyState === 'complete') {
      deferLoad();
    } else {
      window.addEventListener('load', function() {
        // Let main content render first, then load deferred resources
        requestIdleCallback(deferLoad, { timeout: 1000 });
      });
    }
    
    function deferLoad() {
      // First pass: capture all elements to process
      const nonCriticalElements = [];
      
      nonCriticalSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => nonCriticalElements.push(element));
      });
      
      // Process elements in chunks to avoid blocking the main thread
      const chunkSize = 5;
      let processed = 0;
      
      function processNextChunk() {
        const chunk = nonCriticalElements.slice(processed, processed + chunkSize);
        processed += chunkSize;
        
        chunk.forEach(processElement);
        
        if (processed < nonCriticalElements.length) {
          requestIdleCallback(processNextChunk);
        }
      }
      
      // Begin processing
      if (nonCriticalElements.length > 0) {
        processNextChunk();
      }
    }
    
    function processElement(element) {
      // Handle different element types
      if (element.tagName === 'SCRIPT') {
        // For scripts, create a new script element to execute it
        const script = document.createElement('script');
        
        // Copy all attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name !== 'data-defer') {
            script.setAttribute(attr.name, attr.value);
          }
        });
        
        script.textContent = element.textContent;
        element.parentNode.replaceChild(script, element);
      } else if (element.tagName === 'LINK' && element.getAttribute('rel') === 'preload') {
        // For preloaded scripts, load them properly
        if (element.getAttribute('as') === 'script') {
          const script = document.createElement('script');
          script.src = element.href;
          script.async = true;
          document.body.appendChild(script);
        }
      } else if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
        // For stylesheets, remove the defer attribute and let it load normally
        element.removeAttribute('data-defer');
      }
    }
  }
  
  // Start deferrals
  deferNonCriticalResources();
  
  // Mark that optimization script has run
  window.__mainThreadOptimized = true;
})(); 