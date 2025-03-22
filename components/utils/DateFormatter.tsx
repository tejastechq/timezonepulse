'use client';

import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

/**
 * DateFormatter provides client-side date formatting
 * This component avoids hydration mismatches by only rendering on the client
 * where date formatting based on locale is consistent
 */
export default function DateFormatter() {
  const [formattedDate, setFormattedDate] = useState<string>('');
  
  useEffect(() => {
    // Get current date formatted according to user's locale
    const now = DateTime.now();
    const formatted = now.toLocaleString(DateTime.DATE_FULL);
    setFormattedDate(formatted);
    
    // Update every minute
    const timer = setInterval(() => {
      const now = DateTime.now();
      const formatted = now.toLocaleString(DateTime.DATE_FULL);
      setFormattedDate(formatted);
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Render nothing until client-side date is available
  if (!formattedDate) return null;
  
  return (
    <div className="fixed bottom-16 left-4 text-sm text-gray-600 dark:text-gray-400 pointer-events-none">
      {formattedDate}
    </div>
  );
} 