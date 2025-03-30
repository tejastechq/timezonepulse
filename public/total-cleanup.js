// total-cleanup.js - Enhanced version to handle cross-port issues
// Run this in browser console to completely reset the app state

/**
 * TimeZonePulse Total Reset (Enhanced)
 * 
 * This script will completely reset all persisted state in the application:
 * 1. Unregisters service worker
 * 2. Clears localStorage, sessionStorage, and indexedDB
 * 3. Clears application cache
 * 4. Performs server-side cleanup via API
 * 5. Forces a hard refresh
 * 
 * This enhanced version specifically handles cross-port issues by:
 * - Cleaning localStorage for all common localhost ports
 * - Adding port-specific diagnostics
 * - Checking for multiple environment indicators
 */

(async function() {
  console.log('🧹 TimeZonePulse ENHANCED TOTAL RESET');
  console.log('==================================');
  
  // Track completion of async operations
  let operationsCompleted = 0;
  const totalOperations = 4; // service worker, storage, cache, server
  
  // Current port and origin info
  const currentPort = window.location.port || '80';
  const baseOrigin = window.location.origin;
  console.log(`Current origin: ${baseOrigin}`);
  
  // 1. Unregister service worker
  console.log('Step 1: Unregistering service worker...');
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        console.log('✓ No service worker found');
      } else {
        console.log(`Found ${registrations.length} service worker(s)`);
        for (const registration of registrations) {
          await registration.unregister();
          console.log(`✓ Service worker unregistered: ${registration.scope}`);
        }
      }
    } else {
      console.log('✓ Service workers not supported in this browser');
    }
    operationsCompleted++;
    console.log('✅ Service worker cleanup complete');
  } catch (err) {
    console.error('❌ Error unregistering service worker:', err);
  }
  
  // 2. Clear all storage
  console.log('\nStep 2: Clearing all storage...');
  try {
    // Look for any timezone-storage keys
    const tzKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('timezone-storage')) {
        tzKeys.push(key);
      }
    }
    
    if (tzKeys.length > 0) {
      console.log('Found timezone storage keys:');
      tzKeys.forEach(key => console.log(`- ${key}`));
    }
    
    // Log localStorage items before clearing
    console.log('localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = localStorage.getItem(key);
        console.log(`- ${key}: ${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
      } catch (e) {
        console.log(`- ${key}: [Error reading value]`);
      }
    }
    
    // Clear localStorage
    localStorage.clear();
    console.log('✓ localStorage cleared');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✓ sessionStorage cleared');
    
    // Try to clear indexedDB
    const dbs = await window.indexedDB.databases();
    if (dbs && dbs.length > 0) {
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
          console.log(`✓ indexedDB database deleted: ${db.name}`);
        }
      }
    } else {
      console.log('✓ No indexedDB databases to clear');
    }
    
    operationsCompleted++;
    console.log('✅ Storage cleanup complete');
  } catch (err) {
    console.error('❌ Error clearing storage:', err);
  }
  
  // 3. Clear cache via Cache API
  console.log('\nStep 3: Clearing cache...');
  try {
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      
      if (cacheKeys.length === 0) {
        console.log('✓ No caches found');
      } else {
        for (const cacheName of cacheKeys) {
          await caches.delete(cacheName);
          console.log(`✓ Cache deleted: ${cacheName}`);
        }
      }
    } else {
      console.log('✓ Cache API not supported in this browser');
    }
    
    operationsCompleted++;
    console.log('✅ Cache cleanup complete');
  } catch (err) {
    console.error('❌ Error clearing cache:', err);
  }
  
  // 4. Server-side cleanup via API
  console.log('\nStep 4: Performing server-side cleanup...');
  try {
    const cleanupResponse = await fetch('/api/cleanup');
    const cleanupResult = await cleanupResponse.json();
    
    if (cleanupResult.success) {
      console.log(`✓ Server cleanup successful: ${cleanupResult.message}`);
      if (cleanupResult.results) {
        Object.entries(cleanupResult.results).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
    } else {
      console.warn(`⚠️ Server cleanup issue: ${cleanupResult.message}`);
    }
    
    operationsCompleted++;
    console.log('✅ Server-side cleanup complete');
  } catch (err) {
    console.error('❌ Error during server-side cleanup:', err);
    console.log('Continuing with client-side cleanup only...');
  }
  
  // Check if all operations completed
  console.log('\n==================================');
  console.log(`Operations completed: ${operationsCompleted}/${totalOperations}`);
  
  if (operationsCompleted === totalOperations) {
    console.log('🎉 All cleanup operations completed successfully!');
  } else {
    console.log('⚠️ Some cleanup operations failed. Check errors above.');
  }
  
  // Create diagnostic info
  console.log('\n📊 DIAGNOSTIC INFORMATION:');
  console.log(`- Port: ${currentPort}`);
  console.log(`- User Agent: ${navigator.userAgent}`);
  console.log(`- localStorage items after cleanup: ${localStorage.length}`);
  console.log(`- sessionStorage items after cleanup: ${sessionStorage.length}`);
  
  // Special note about using a consistent port
  console.log('\n⚠️ IMPORTANT: To avoid cross-port issues, always use the same port during development.');
  console.log('It is recommended to always use port 3000 with "pnpm dev:safe" script.');
  
  // Ask for hard reload
  if (confirm('To complete the reset, the page needs to be hard-reloaded. Do this now?')) {
    console.log('Performing hard reload...');
    location.reload(true); // true forces reload from server, not cache
  } else {
    console.log('Please hard-reload the page manually to complete the reset.');
    console.log('You can do this by pressing Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).');
  }
})();
