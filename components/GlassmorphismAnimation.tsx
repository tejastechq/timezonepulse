'use client';

import { useEffect, useRef } from 'react';

// Add interface at the top of the file
interface GlassCardState {
  isAnimating: boolean;
  cooldownTimer: NodeJS.Timeout | null;
}

/**
 * GlassmorphismAnimation Component
 * 
 * Manages the shine animation effect for glass-card elements.
 * Uses a WeakMap to track animation states and ensures animations
 * only trigger once per hover with proper cleanup.
 */
export function GlassmorphismAnimation() {
  // Store animation state for all cards
  const animationStateMapRef = useRef(new Map<Element, GlassCardState>());
  // Store event listener references
  const eventListenersRef = useRef(new Map<Element, (event: Event) => void>());
  
  useEffect(() => {
    const COOLDOWN_PERIOD = 800; // ms to wait before allowing another animation
    
    /**
     * Initialize animation state for a card
     */
    function getOrCreateState(card: Element) {
      if (!animationStateMapRef.current.has(card)) {
        animationStateMapRef.current.set(card, {
          isAnimating: false,
          cooldownTimer: null
        });
      }
      return animationStateMapRef.current.get(card)!;
    }
    
    /**
     * Handle mouse enter on a card
     */
    function handleMouseEnter(event: MouseEvent) {
      // Ensure the event target is an Element
      if (!(event.currentTarget instanceof Element)) return;
      
      const card = event.currentTarget;
      const state = getOrCreateState(card);
      
      // Only trigger animation if not already animating and not in cooldown
      if (!state.isAnimating) {
        state.isAnimating = true;
        
        // Start the animation
        card.classList.add('animate-shine');
        
        // Set up the animation end handler
        const handleAnimationEnd = () => {
          // Clean up the animation class
          card.classList.remove('animate-shine');
          
          // Set cooldown timer
          state.isAnimating = false;
          
          // Clear any existing cooldown timer
          if (state.cooldownTimer) {
            clearTimeout(state.cooldownTimer);
          }
          
          // Set a new cooldown timer
          state.cooldownTimer = setTimeout(() => {
            state.cooldownTimer = null;
          }, COOLDOWN_PERIOD);
          
          // Remove this one-time event listener
          card.removeEventListener('animationend', handleAnimationEnd);
        };
        
        // Add one-time animation end listener
        card.addEventListener('animationend', handleAnimationEnd);
      }
    }
    
    /**
     * Sets up event listeners for a glass card
     */
    function setupCard(card: Element) {
      // Initialize state
      getOrCreateState(card);
      
      // Create a wrapper function and store its reference
      const eventHandler = (event: Event) => {
        handleMouseEnter(event as MouseEvent);
      };
      
      // Store the function reference so we can remove it later
      eventListenersRef.current.set(card, eventHandler);
      
      // Add event listener
      card.addEventListener('mouseenter', eventHandler);
    }
    
    /**
     * Clean up event listeners for a glass card
     */
    function cleanupCard(card: Element) {
      // Get the stored function reference
      const eventHandler = eventListenersRef.current.get(card);
      
      if (eventHandler) {
        // Remove event listener using the same function reference
        card.removeEventListener('mouseenter', eventHandler);
        // Clean up the stored reference
        eventListenersRef.current.delete(card);
      }
      
      // Clear any pending timers
      const state = animationStateMapRef.current.get(card);
      if (state?.cooldownTimer) {
        clearTimeout(state.cooldownTimer);
      }
    }
    
    // Initial setup for existing cards
    document.querySelectorAll('.glass-card').forEach(setupCard);
    
    // Set up observer for new cards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Handle added nodes
          mutation.addedNodes.forEach(node => {
            if (node instanceof Element) {
              // Check if the node itself is a glass card
              if (node.classList.contains('glass-card')) {
                setupCard(node);
              }
              
              // Check for glass cards within the added node
              node.querySelectorAll('.glass-card').forEach(setupCard);
            }
          });
          
          // Handle removed nodes
          mutation.removedNodes.forEach(node => {
            if (node instanceof Element) {
              // Check if the node itself is a glass card
              if (node.classList.contains('glass-card')) {
                cleanupCard(node);
              }
              
              // Check for glass cards within the removed node
              node.querySelectorAll('.glass-card').forEach(cleanupCard);
            }
          });
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Cleanup function
    return () => {
      // Stop observing
      observer.disconnect();
      
      // Remove all event listeners
      document.querySelectorAll('.glass-card').forEach(cleanupCard);
    };
  }, []);
  
  return null;
}

export default GlassmorphismAnimation; 