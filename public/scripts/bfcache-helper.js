/**
 * BFCache Helper Script
 * Improves back/forward cache compatibility by handling connection lifecycles
 */
(function() {
  // Function to disconnect any active connections when page is frozen
  function handlePageFreeze() {
    // Close any active connections when page is frozen (entering bfcache)
    if (typeof window.__VERCEL_INSIGHTS !== 'undefined' && window.__VERCEL_INSIGHTS.disconnect) {
      window.__VERCEL_INSIGHTS.disconnect();
    }
    
    if (typeof window.__SPEED_INSIGHTS !== 'undefined' && window.__SPEED_INSIGHTS.disconnect) {
      window.__SPEED_INSIGHTS.disconnect();
    }
    
    // Log for debugging
    console.debug('[bfcache] Page frozen, connections paused');
  }

  // Function to handle page restoration from bfcache
  function handlePageRestore() {
    // Mark the document as restored from bfcache
    document.documentElement.dataset.bfcacheRestored = 'true';
    
    // Reconnect necessary services after restoration
    if (typeof window.__VERCEL_INSIGHTS !== 'undefined' && window.__VERCEL_INSIGHTS.reconnect) {
      window.__VERCEL_INSIGHTS.reconnect();
    }
    
    if (typeof window.__SPEED_INSIGHTS !== 'undefined' && window.__SPEED_INSIGHTS.reconnect) {
      window.__SPEED_INSIGHTS.reconnect();
    }
    
    // Dispatch custom event that components can listen for
    window.dispatchEvent(new CustomEvent('bfcacherestored'));
    
    // Log for debugging
    console.debug('[bfcache] Page restored from cache');
  }
  
  // Listen for page freeze event (page entering bfcache)
  window.addEventListener('freeze', handlePageFreeze);
  
  // Listen for page resume event (page restored from bfcache)
  window.addEventListener('resume', handlePageRestore);
  
  // Also handle pageshow event (compatible with more browsers)
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      // Page was restored from bfcache
      handlePageRestore();
    }
  });
  
  // Record initial page load
  console.debug('[bfcache] Script initialized');
})(); 