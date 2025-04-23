import { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Calendar } from './ui/calendar';
import { createPortal } from 'react-dom';

interface DatePickerSidebarTriggerProps {
  onSidebarCollapse: () => void;
}

export function DatePickerSidebarTrigger({ onSidebarCollapse }: DatePickerSidebarTriggerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleOpen = () => {
    onSidebarCollapse();
    setTimeout(() => setShowPicker(true), 200); // Wait for sidebar to close
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowPicker(false);
    // Optionally: trigger any global state update here
  };

  // Render modal at the app root using a portal
  const calendarModal = showPicker && typeof window !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPicker(false)} />
          <div className="relative z-10">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateChange}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Sidebar menu item button */}
      <button
        className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800 w-full"
        onClick={handleOpen}
        type="button"
      >
        <CalendarDaysIcon className="w-6 h-6 text-gray-200" />
        <span className="text-white">Select Date</span>
      </button>
      {calendarModal}
    </>
  );
} 