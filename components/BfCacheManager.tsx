'use client';

import { useEffect } from 'react';

/**
 * BfCacheManager component
 * 
 * This component specifically manages persistent connections (like WebSockets)
 * to ensure they don't prevent Back/Forward cache from working.
 * 
 * It properly disconnects connections when a page is frozen (entering bfcache)
 * and reconnects them when the page is restored from bfcache.
 */
export default function BfCacheManager() {
  useEffect(() => {
    // Get any active connections that need to be managed
    const getActiveConnections = () => {
      const connections: any[] = [];
      
      // Check for Vercel connections
      if (typeof window.__VERCEL_INSIGHTS !== 'undefined') {
        connections.push(window.__VERCEL_INSIGHTS);
      }
      
      if (typeof window.__SPEED_INSIGHTS !== 'undefined') {
        connections.push(window.__SPEED_INSIGHTS);
      }
      
      // Add other connections as needed
      return connections;
    };
    
    // Disconnect all connections
    const disconnectAll = () => {
      const connections = getActiveConnections();
      
      connections.forEach(connection => {
        if (connection && typeof connection.disconnect === 'function') {
          try {
            connection.disconnect();
            console.debug('[BfCacheManager] Disconnected:', connection);
          } catch (e) {
            console.error('[BfCacheManager] Error disconnecting:', e);
          }
        }
      });
    };
    
    // Reconnect all connections
    const reconnectAll = () => {
      const connections = getActiveConnections();
      
      connections.forEach(connection => {
        if (connection && typeof connection.reconnect === 'function') {
          try {
            connection.reconnect();
            console.debug('[BfCacheManager] Reconnected:', connection);
          } catch (e) {
            console.error('[BfCacheManager] Error reconnecting:', e);
          }
        }
      });
    };
    
    // Handle page freeze event (entering bfcache)
    const handleFreeze = () => {
      console.debug('[BfCacheManager] Page frozen - disconnecting connections');
      disconnectAll();
    };
    
    // Handle page resume event (restored from bfcache)
    const handleResume = () => {
      console.debug('[BfCacheManager] Page resumed - reconnecting connections');
      reconnectAll();
    };
    
    // Handle pageshow event (for broader browser support)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.debug('[BfCacheManager] Page restored via pageshow event');
        reconnectAll();
      }
    };
    
    // Register event listeners
    window.addEventListener('freeze', handleFreeze);
    window.addEventListener('resume', handleResume);
    window.addEventListener('pageshow', handlePageShow);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('freeze', handleFreeze);
      window.removeEventListener('resume', handleResume);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 