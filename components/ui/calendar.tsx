'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';

export type CalendarProps = {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
};

export function Calendar({
  selectedDate = null,
  onDateSelect,
  onClose,
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    return DateTime.fromJSDate(selectedDate ?? new Date()).startOf('month');
  });

  // Create calendar grid for the current month
  const calendarDays = React.useMemo(() => {
    const days = [];
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    
    // Start from the beginning of the week containing the first day of the month
    let currentDay = startOfMonth.startOf('week');
    
    // Add days until we reach the end of the week containing the last day of the month
    while (currentDay <= endOfMonth.endOf('week')) {
      days.push(currentDay);
      currentDay = currentDay.plus({ days: 1 });
    }
    
    return days;
  }, [currentMonth]);

  // Handle navigation between months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => prev.minus({ months: 1 }));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => prev.plus({ months: 1 }));
  };

  // Handle date selection
  const handleDateClick = (day: DateTime) => {
    onDateSelect(day.toJSDate());
    onClose();
  };

  // Handle clearing the date
  const handleClearClick = () => {
    onDateSelect(null);
    onClose();
  };

  // Check if a date is selectable based on min/max constraints
  const isDateSelectable = (date: DateTime) => {
    if (minDate && date < DateTime.fromJSDate(minDate).startOf('day')) return false;
    if (maxDate && date > DateTime.fromJSDate(maxDate).endOf('day')) return false;
    return true;
  };

  return (
    <div className="rounded-2xl px-8 py-6 shadow-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/70 backdrop-blur-2xl text-white"
      style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)' }}>
      {/* Calendar header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-blue-800/40 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <h2 className="font-semibold text-lg text-white">
          {currentMonth.toFormat('MMMM yyyy')}
        </h2>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-blue-800/40 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2 text-center text-xs font-medium text-white/70">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isCurrentMonth = day.month === currentMonth.month;
          const isToday = day.hasSame(DateTime.local(), 'day');
          const isSelected = selectedDate ? day.hasSame(DateTime.fromJSDate(selectedDate), 'day') : false;
          const isSelectable = isDateSelectable(day);
          
          return (
            <button
              key={day.toISO()}
              type="button"
              onClick={() => isSelectable && handleDateClick(day)}
              disabled={!isSelectable}
              className={[
                'h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                isCurrentMonth ? 'text-white' : 'text-white/40',
                isToday ? 'border border-blue-400' : '',
                isSelected ? 'bg-blue-700 text-white shadow' : '',
                isSelectable && !isSelected ? 'hover:bg-blue-800/40' : '',
                !isSelectable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const today = DateTime.local().startOf('day');
              if (isDateSelectable(today)) {
                onDateSelect(today.toJSDate());
                onClose();
              }
            }}
            className="px-4 py-2 text-sm font-medium bg-slate-800/80 text-white rounded-md hover:bg-blue-800/40 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleClearClick}
            className="px-4 py-2 text-sm font-medium bg-slate-800/80 text-white rounded-md hover:bg-red-800/40 transition-colors"
          >
            Clear
          </button>
        </div>
        
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium bg-slate-800/80 text-white rounded-md hover:bg-blue-800/40 transition-colors border border-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 