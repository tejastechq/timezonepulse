'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner'; // Assuming sonner is used based on modern Next.js apps

type StatusState = 'operational' | 'degraded' | 'maintenance' | 'outage' | 'loading';

interface StatusIndicatorProps {
  className?: string;
}

export default function StatusIndicator({ className = '' }: StatusIndicatorProps) {
  const [status, setStatus] = useState<StatusState>('loading');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const previousStatus = useRef<StatusState | null>(null);

  useEffect(() => {
    // Function to fetch status from Statuspage API
    const fetchStatus = async () => {
      try {
        const response = await fetch('https://timezonepulse1.statuspage.io/api/v2/summary.json', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        
        let newStatus: StatusState = 'operational';
        
        // Determine status based on response
        if (data.status?.indicator === 'none') {
          newStatus = 'operational';
        } else if (data.status?.indicator === 'minor') {
          newStatus = 'degraded';
        } else if (data.status?.indicator === 'major') {
          newStatus = 'outage';
        } else if (data.status?.indicator === 'maintenance') {
          newStatus = 'maintenance';
        }
        
        // Check if status has changed (and not the first load)
        if (previousStatus.current !== null && previousStatus.current !== newStatus) {
          // Show notification based on the new status
          const statusInfo = getStatusInfo(newStatus);
          toast(
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${statusInfo.bgColor}`}></span>
              <span><strong>System Status Change:</strong> {statusInfo.text}</span>
            </div>,
            {
              duration: 8000,
              position: 'top-right',
              closeButton: true,
              action: {
                label: 'View Details',
                onClick: () => window.open('https://timezonepulse1.statuspage.io', '_blank'),
              },
            }
          );
        }
        
        // Update the status state and reference
        setStatus(newStatus);
        previousStatus.current = newStatus;
        setLastChecked(new Date());
      } catch (error) {
        console.error('Error fetching status:', error);
        // Keep previous status or set to operational if this is first load
        if (status === 'loading') {
          setStatus('operational');
          previousStatus.current = 'operational';
        }
      }
    };

    // Fetch status on component mount
    fetchStatus();
    
    // Set up interval to check every 5 minutes
    const intervalId = setInterval(fetchStatus, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Status styling
  const getStatusInfo = (statusType: StatusState) => {
    switch (statusType) {
      case 'operational':
        return {
          text: 'All Systems Operational',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          icon: '●',
        };
      case 'degraded':
        return {
          text: 'Degraded Performance',
          bgColor: 'bg-yellow-500',
          textColor: 'text-gray-900',
          icon: '●',
        };
      case 'maintenance':
        return {
          text: 'Maintenance in Progress',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          icon: '●',
        };
      case 'outage':
        return {
          text: 'System Outage',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          icon: '●',
        };
      case 'loading':
      default:
        return {
          text: 'Checking Status...',
          bgColor: 'bg-gray-300',
          textColor: 'text-gray-700',
          icon: '○',
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Link
      href="https://timezonepulse1.statuspage.io"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-full py-1 px-3 text-sm transition-all hover:brightness-95 ${statusInfo.bgColor} ${statusInfo.textColor} ${className}`}
    >
      <span className="text-lg">{statusInfo.icon}</span>
      <span>{statusInfo.text}</span>
    </Link>
  );
} 