// Priority Hints script - executed early to optimize LCP
(function() {
  // Mark the main heading for high priority
  document.addEventListener('DOMContentLoaded', function() {
    // Find the main heading
    const lcpElement = document.getElementById('main-heading');
    if (lcpElement) {
      // Apply priority hints if browser supports it
      if ('fetchPriority' in HTMLImageElement.prototype) {
        lcpElement.fetchPriority = 'high';
      } else {
        // Fallback for browsers without fetchPriority support
        lcpElement.setAttribute('importance', 'high');
      }
    }
    
    // Also prioritize the clock face image if present
    const clockFaceImage = document.querySelector('img[src*="clock-face"]');
    if (clockFaceImage) {
      if ('fetchPriority' in HTMLImageElement.prototype) {
        clockFaceImage.fetchPriority = 'high';
      } else {
        clockFaceImage.setAttribute('importance', 'high');
      }
    }
  });
})(); 