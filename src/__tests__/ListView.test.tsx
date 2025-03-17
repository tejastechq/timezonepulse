import { render, screen, fireEvent } from '@testing-library/react';
import { ListView } from '@/components/ListView';
import { getCommonTimezones } from '@/lib/timezone-utils';
import { vi } from 'vitest';

// Mock current time for predictable testing
vi.mock('luxon', () => {
  const DateTime = {
    now: () => ({
      setZone: (tz) => ({
        hour: 12,
        minute: 0,
        toFormat: (format) => '12:00 PM',
        isInDST: false,
        offset: 0,
        weekday: 1,
        set: () => ({
          setZone: () => ({
            toFormat: () => '12:00 PM',
          }),
        }),
        plus: () => ({
          toFormat: () => 'May 1, 2023',
        }),
        minus: () => ({
          toFormat: () => 'Apr 29, 2023',
        }),
      }),
    }),
  };
  
  return { DateTime };
});

describe('ListView Component', () => {
  const mockTimezones = getCommonTimezones();
  const mockOnAddTimezone = vi.fn();
  const mockOnRemoveTimezone = vi.fn();
  const mockOnTimeSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders the ListView component with timezones', () => {
    render(
      <ListView 
        timezones={mockTimezones}
        onAddTimezone={mockOnAddTimezone}
        onRemoveTimezone={mockOnRemoveTimezone}
        onTimeSelect={mockOnTimeSelect}
      />
    );
    
    // Check if component renders
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    
    // Check if timezones are rendered
    mockTimezones.forEach(tz => {
      expect(screen.getByText(tz.city)).toBeInTheDocument();
    });
  });
  
  test('changes view when Week tab is clicked', () => {
    render(
      <ListView 
        timezones={mockTimezones}
        onAddTimezone={mockOnAddTimezone}
        onRemoveTimezone={mockOnRemoveTimezone}
        onTimeSelect={mockOnTimeSelect}
      />
    );
    
    // Initially in Day view
    fireEvent.click(screen.getByText('Week'));
    
    // Should now be in Week view
    expect(screen.getByText('Week').getAttribute('aria-selected')).toBe('true');
  });
  
  test('selecting a time slot triggers onTimeSelect', () => {
    render(
      <ListView 
        timezones={mockTimezones}
        onAddTimezone={mockOnAddTimezone}
        onRemoveTimezone={mockOnRemoveTimezone}
        onTimeSelect={mockOnTimeSelect}
      />
    );
    
    // Find and click a time slot
    const timeSlots = screen.getAllByText('12:00 PM');
    fireEvent.click(timeSlots[0]);
    
    // Check if onTimeSelect was called
    expect(mockOnTimeSelect).toHaveBeenCalled();
  });
}); 