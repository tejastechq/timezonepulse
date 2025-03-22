'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * DevInfo component displays development information in non-production environments
 * This is only rendered on the client side to avoid hydration mismatches
 */
export default function DevInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();
  
  // Only show in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Show component
    setIsVisible(true);
    
    // Calculate FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const calculateFps = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime > 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
        
        // Get memory usage if available
        if (
          'performance' in window && 
          'memory' in performance && 
          (performance as any).memory
        ) {
          const memoryInfo = (performance as any).memory;
          setMemory(Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)));
        }
      }
      
      requestAnimationFrame(calculateFps);
    };
    
    const frameId = requestAnimationFrame(calculateFps);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 left-4 text-xs bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-md shadow-md backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">ENV:</span>
          <span className="ml-2 text-green-600 dark:text-green-400">DEV</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">FPS:</span>
          <span className={`ml-2 ${fps < 30 ? 'text-red-500' : 'text-green-500'}`}>
            {fps}
          </span>
        </div>
        {memory !== null && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">MEM:</span>
            <span className="ml-2 text-blue-500 dark:text-blue-400">
              {memory} MB
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">THEME:</span>
          <span className="ml-2 text-purple-500 dark:text-purple-400">
            {resolvedTheme?.toUpperCase() || 'SYSTEM'}
          </span>
        </div>
      </div>
    </div>
  );
} 