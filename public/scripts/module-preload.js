/**
 * Module Preload Optimization
 * 
 * This script helps optimize JavaScript loading by:
 * 1. Preloading critical modules
 * 2. Using modulepreload for module scripts
 * 3. Intelligently managing script loading priority
 */
(function() {
  // Define critical modules that should be preloaded
  const criticalModules = [
    '/chunks/main-app.js',
    '/chunks/framework.js',
    '/chunks/worldclock.js',
    '/chunks/timezone-store.js'
  ];
  
  // Function to create module preload links
  function preloadModule(src, importance = 'high') {
    if (!src) return;
    
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = src;
    link.importance = importance;
    
    document.head.appendChild(link);
  }
  
  // Preload critical modules immediately
  criticalModules.forEach(module => {
    preloadModule(module);
  });
  
  // Set up observer to preload modules in the viewport
  if ('IntersectionObserver' in window) {
    const modulePreloadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // When element enters viewport
        if (entry.isIntersecting) {
          const element = entry.target;
          const modules = element.dataset.modules;
          
          if (modules) {
            modules.split(',').forEach(module => {
              preloadModule(module.trim(), 'low');
            });
          }
          
          // Stop observing this element
          modulePreloadObserver.unobserve(element);
        }
      });
    }, { rootMargin: '200px' });
    
    // Find elements that need modules and observe them
    document.querySelectorAll('[data-modules]').forEach(element => {
      modulePreloadObserver.observe(element);
    });
  }
  
  // Create predictive preloading for common user flows
  document.addEventListener('DOMContentLoaded', () => {
    // Track user interactions to predict module needs
    document.addEventListener('click', event => {
      // Find closest interactive element
      const interactive = event.target.closest('a, button, [role="button"]');
      
      if (interactive) {
        // Check if target element has data-modules-on-interaction
        const modulesToPreload = interactive.dataset.modulesOnInteraction;
        
        if (modulesToPreload) {
          modulesToPreload.split(',').forEach(module => {
            // Use lower importance for predicted modules
            preloadModule(module.trim(), 'low');
          });
        }
      }
    }, { passive: true });
  });
})(); 