'use client';

import { useEffect, useState } from 'react';
import { useAppVersion } from '@/store/timezoneStore';

/**
 * DevInfo Component
 * 
 * Displays development information including:
 * - Current app version
 * - Build ID
 * - Port being used
 * - LocalStorage status
 * 
 * Only shown in development mode
 */
export default function DevInfo() {
  const appVersion = useAppVersion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [origin, setOrigin] = useState<string>('');
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  
  // Collect information about the environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      
      // Get all localStorage keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      setStorageKeys(keys);
    }
  }, []);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-2 right-2 z-50">
      <div 
        className={`bg-black/80 text-white rounded-lg shadow-lg text-xs p-2 transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono">
              v{appVersion.version} ({appVersion.buildId})
            </span>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="ml-2 p-1 hover:bg-white/20 rounded"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-2 space-y-2 font-mono">
            <div className="border-t border-white/20 pt-2">
              <div className="flex justify-between">
                <span>Origin:</span>
                <span className="font-bold">{origin}</span>
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="font-bold">{typeof window !== 'undefined' ? window.location.port : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-bold">{new Date(appVersion.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-2">
              <div className="flex justify-between">
                <span>LocalStorage:</span>
                <span className="font-bold">{storageKeys.length} keys</span>
              </div>
              <div className="max-h-24 overflow-y-auto text-xs mt-1">
                {storageKeys.map(key => (
                  <div key={key} className="truncate hover:text-blue-300">
                    {key}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-2 flex justify-between">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs"
              >
                Clear Storage & Reload
              </button>
              
              <button
                onClick={() => {
                  if (confirm('This will run a complete cleanup and reload the page. Continue?')) {
                    // Run the total cleanup script
                    fetch('/api/cleanup')
                      .then(() => window.location.reload())
                      .catch(() => window.location.reload());
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-xs"
              >
                Total Cleanup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 