'use client';

import React, { useState } from 'react';
import { useIntegrations } from '@/app/contexts/IntegrationsContext';
import { DateTime } from 'luxon';
import { isInDST, getDSTTransitions } from '@/lib/utils/timezone';

interface ContextualInfoProps {
  timezone: string;
}

/**
 * ContextualInfo component for displaying contextual information about a timezone
 */
export default function ContextualInfo({ timezone }: ContextualInfoProps) {
  const { getContextualInfoForTimezone, addContextualInfo } = useIntegrations();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get contextual info for the timezone
  const contextualInfo = getContextualInfoForTimezone(timezone);
  
  // Check if the timezone is in DST
  const isDST = isInDST(timezone);
  
  // Get DST transitions for the timezone
  const dstTransitions = getDSTTransitions(timezone);
  
  // Format DST transition dates
  const formatTransitionDate = (date: DateTime | null) => {
    if (!date) return 'N/A';
    return date.toFormat('MMM d, yyyy');
  };
  
  // Handle adding default contextual info
  const handleAddDefaultInfo = () => {
    addContextualInfo({
      timezone,
      businessHours: {
        start: '09:00',
        end: '17:00'
      },
      holidays: []
    });
  };
  
  // Handle toggling edit mode
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };
  
  // If no contextual info exists, show add button
  if (!contextualInfo) {
    return (
      <div className="mt-2">
        <button
          onClick={handleAddDefaultInfo}
          className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Add contextual information
        </button>
      </div>
    );
  }
  
  return (
    <div className="mt-2 text-sm">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Contextual Info</h4>
        <button
          onClick={handleToggleEdit}
          className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>
      
      {/* Business Hours */}
      <div className="mb-2">
        <span className="text-gray-500 dark:text-gray-400">Business Hours: </span>
        <span>{contextualInfo.businessHours.start} - {contextualInfo.businessHours.end}</span>
      </div>
      
      {/* DST Information */}
      {isDST && (
        <div className="mb-2">
          <span className="text-amber-600 dark:text-amber-400">Currently in DST</span>
          {dstTransitions && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div>Started: {formatTransitionDate(dstTransitions.start)}</div>
              <div>Ends: {formatTransitionDate(dstTransitions.end)}</div>
            </div>
          )}
        </div>
      )}
      
      {/* Holidays */}
      {contextualInfo.holidays.length > 0 && (
        <div>
          <h5 className="font-medium mb-1">Upcoming Holidays:</h5>
          <ul className="text-xs">
            {contextualInfo.holidays.map((holiday, index) => (
              <li key={index} className="mb-1">
                <span className="text-gray-500 dark:text-gray-400">{holiday.date}: </span>
                <span>{holiday.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 