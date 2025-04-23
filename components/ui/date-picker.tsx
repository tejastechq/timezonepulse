'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X as ClearIcon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleDateSelect = (date: Date | null) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(null);
  };

  const formattedDate = selectedDate ? new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(selectedDate) : 'Select Date';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm"
            aria-label={selectedDate ? `Change date, currently selected: ${formattedDate}` : "Select a date"}
            title={selectedDate ? `Selected: ${formattedDate}` : "Select Date"}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{formattedDate}</span>
          </button>
        </Dialog.Trigger>
        
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/25 z-30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-40 translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <Dialog.Title className="sr-only">Date Navigator - View times for a specific date</Dialog.Title>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onClose={() => setIsOpen(false)}
              minDate={minDate}
              maxDate={maxDate}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {selectedDate && (
        <button
          type="button"
          onClick={handleClearClick}
          className="p-2 rounded-full hover:bg-red-800/40 transition-colors text-muted-foreground hover:text-destructive"
          aria-label="Clear selected date"
          title="Clear date"
        >
          <ClearIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 