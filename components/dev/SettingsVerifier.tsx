'use client';

import { useState } from 'react';
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';
import { formatTime, formatDate, isBusinessHours, isNightHours, isWeekend } from '@/lib/utils/dateTimeFormatter';
import { DateTime } from 'luxon';

// Test result interface
interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export default function SettingsVerifier() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const settings = useSettingsStore();
  
  // Test Weekend Highlight Color
  const testWeekendHighlightColor = async (): Promise<TestResult> => {
    // Get original value
    const originalValue = settings.weekendHighlightColor;
    
    try {
      // Test changing to a different color
      const newValue = originalValue === 'red' ? 'blue' : 'red';
      settings.setWeekendHighlightColor(newValue);
      
      // Verify store was updated
      const currentValue = useSettingsStore.getState().weekendHighlightColor;
      if (currentValue !== newValue) {
        return {
          name: 'Weekend Highlight Color',
          passed: false,
          details: `Setting not saved correctly. Expected ${newValue}, got ${currentValue}`
        };
      }
      
      // Verify highlight class functionality
      const highlightClass = getWeekendHighlightClass(newValue);
      const expectedClass = newValue === 'red' 
        ? 'bg-red-50/30 dark:bg-red-900/10'
        : 'bg-blue-50/30 dark:bg-blue-900/10';
      
      if (highlightClass !== expectedClass) {
        return {
          name: 'Weekend Highlight Color',
          passed: false,
          details: `Highlight class not using setting correctly. Expected "${expectedClass}", but got "${highlightClass}"`
        };
      }
      
      // Restore original value
      settings.setWeekendHighlightColor(originalValue);
      
      return {
        name: 'Weekend Highlight Color',
        passed: true,
        details: 'Setting updates and is reflected in weekend highlighting'
      };
    } catch (error) {
      // Restore original value
      settings.setWeekendHighlightColor(originalValue);
      
      return {
        name: 'Weekend Highlight Color',
        passed: false,
        details: `Error testing weekend highlight: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Time Format
  const testTimeFormat = async (): Promise<TestResult> => {
    // Get original value
    const originalValue = settings.timeFormat;
    
    try {
      // Test changing to opposite value
      const newValue = originalValue === '12h' ? '24h' : '12h';
      settings.setTimeFormat(newValue);
      
      // Verify store was updated
      const currentValue = useSettingsStore.getState().timeFormat;
      if (currentValue !== newValue) {
        return {
          name: 'Time Format Setting',
          passed: false,
          details: `Setting not saved correctly. Expected ${newValue}, got ${currentValue}`
        };
      }
      
      // Verify formatter behavior
      const testDate = new Date();
      const formattedTime = formatTime(testDate);
      
      // Check for expected format
      const is24HourFormat = formattedTime.includes('AM') || formattedTime.includes('PM') || formattedTime.includes('am') || formattedTime.includes('pm') ? false : true;
      const expectedFormat = newValue === '24h';
      
      if (is24HourFormat !== expectedFormat) {
        return {
          name: 'Time Format Setting',
          passed: false,
          details: `Formatter not using setting correctly. Expected format "${newValue}", but got ${is24HourFormat ? '24h' : '12h'} format`
        };
      }
      
      // Restore original value
      settings.setTimeFormat(originalValue);
      
      return {
        name: 'Time Format Setting',
        passed: true,
        details: 'Setting updates and is reflected in time formatting'
      };
    } catch (error) {
      // Restore original value
      settings.setTimeFormat(originalValue);
      
      return {
        name: 'Time Format Setting',
        passed: false,
        details: `Error testing time format: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Date Format
  const testDateFormat = async (): Promise<TestResult> => {
    // Get original value
    const originalValue = settings.dateFormat;
    
    try {
      // Test changing to a different format
      const formats: ('MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD')[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
      const newValue = formats.find(f => f !== originalValue) || 'YYYY-MM-DD';
      
      settings.setDateFormat(newValue);
      
      // Verify store was updated
      const currentValue = useSettingsStore.getState().dateFormat;
      if (currentValue !== newValue) {
        return {
          name: 'Date Format Setting',
          passed: false,
          details: `Setting not saved correctly. Expected ${newValue}, got ${currentValue}`
        };
      }
      
      // Verify formatter behavior - we'll check for format-specific separators
      const testDate = new Date();
      const formattedDate = formatDate(testDate);
      
      let formatCorrect = false;
      if (newValue === 'MM/DD/YYYY' && formattedDate.includes('/')) formatCorrect = true;
      if (newValue === 'DD/MM/YYYY' && formattedDate.includes('/')) formatCorrect = true;
      if (newValue === 'YYYY-MM-DD' && formattedDate.includes('-')) formatCorrect = true;
      
      if (!formatCorrect) {
        return {
          name: 'Date Format Setting',
          passed: false,
          details: `Formatter not using setting correctly. Expected format "${newValue}", but got "${formattedDate}"`
        };
      }
      
      // Restore original value
      settings.setDateFormat(originalValue);
      
      return {
        name: 'Date Format Setting',
        passed: true,
        details: 'Setting updates and is reflected in date formatting'
      };
    } catch (error) {
      // Restore original value
      settings.setDateFormat(originalValue);
      
      return {
        name: 'Date Format Setting',
        passed: false,
        details: `Error testing date format: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Show Seconds
  const testShowSeconds = async (): Promise<TestResult> => {
    // Get original value
    const originalValue = settings.showSeconds;
    
    try {
      // Test toggling the value
      const newValue = !originalValue;
      settings.setShowSeconds(newValue);
      
      // Verify store was updated
      const currentValue = useSettingsStore.getState().showSeconds;
      if (currentValue !== newValue) {
        return {
          name: 'Show Seconds Setting',
          passed: false,
          details: `Setting not saved correctly. Expected ${newValue}, got ${currentValue}`
        };
      }
      
      // Verify formatter behavior - we'll check if the formatted time includes seconds
      const testDate = new Date();
      const formattedTime = formatTime(testDate);
      
      // Check if seconds are included (we count colons - 1 for HH:MM, 2 for HH:MM:SS)
      const hasSeconds = (formattedTime.match(/:/g) || []).length > 1;
      
      if (hasSeconds !== newValue) {
        return {
          name: 'Show Seconds Setting',
          passed: false,
          details: `Formatter not using setting correctly. Expected ${newValue ? 'to show' : 'to hide'} seconds, but formatted time ${hasSeconds ? 'includes' : 'does not include'} seconds`
        };
      }
      
      // Restore original value
      settings.setShowSeconds(originalValue);
      
      return {
        name: 'Show Seconds Setting',
        passed: true,
        details: 'Setting updates and is reflected in time formatting'
      };
    } catch (error) {
      // Restore original value
      settings.setShowSeconds(originalValue);
      
      return {
        name: 'Show Seconds Setting',
        passed: false,
        details: `Error testing show seconds: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Business Hours
  const testBusinessHours = async (): Promise<TestResult> => {
    // Get original values
    const originalStart = settings.nightHoursStart;
    const originalEnd = settings.nightHoursEnd;
    
    try {
      // Test changing to different hours
      const newStart = (originalStart + 1) % 24;
      const newEnd = (originalEnd + 1) % 24;
      settings.setNightHours(newStart, newEnd);
      
      // Verify store was updated
      const currentState = useSettingsStore.getState();
      if (currentState.nightHoursStart !== newStart || currentState.nightHoursEnd !== newEnd) {
        return {
          name: 'Business Hours Setting',
          passed: false,
          details: `Settings not saved correctly. Expected ${newStart}-${newEnd}, got ${currentState.nightHoursStart}-${currentState.nightHoursEnd}`
        };
      }
      
      // Verify business hours function behavior
      // Create test dates - one during new business hours and one outside
      const businessDay = DateTime.now().set({ weekday: 2 }); // Tuesday
      const testDateInside = businessDay.set({ hour: newStart + (newStart < newEnd ? 1 : 0) % 24 }).toJSDate();
      const testDateOutside = businessDay.set({ hour: (newEnd + 1) % 24 }).toJSDate();
      
      const insideResult = isBusinessHours(testDateInside);
      const outsideResult = isBusinessHours(testDateOutside);
      
      if (!insideResult || outsideResult) {
        return {
          name: 'Business Hours Setting',
          passed: false,
          details: `Business hours function not using settings correctly. 
            Time during business hours (${newStart + 1}:00) reported as ${insideResult ? 'within' : 'outside'} business hours.
            Time outside business hours (${newEnd + 1}:00) reported as ${outsideResult ? 'within' : 'outside'} business hours.`
        };
      }
      
      // Restore original values
      settings.setNightHours(originalStart, originalEnd);
      
      return {
        name: 'Business Hours Setting',
        passed: true,
        details: 'Setting updates and is reflected in business hours detection'
      };
    } catch (error) {
      // Restore original values
      settings.setNightHours(originalStart, originalEnd);
      
      return {
        name: 'Business Hours Setting',
        passed: false,
        details: `Error testing business hours: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Night Hours
  const testNightHours = async (): Promise<TestResult> => {
    // Get original values
    const originalStart = settings.nightHoursStart;
    const originalEnd = settings.nightHoursEnd;
    
    try {
      // Test changing to different hours
      const newStart = (originalStart + 1) % 24;
      const newEnd = (originalEnd + 1) % 24;
      settings.setNightHours(newStart, newEnd);
      
      // Verify store was updated
      const currentState = useSettingsStore.getState();
      if (currentState.nightHoursStart !== newStart || currentState.nightHoursEnd !== newEnd) {
        return {
          name: 'Night Hours Setting',
          passed: false,
          details: `Settings not saved correctly. Expected ${newStart}-${newEnd}, got ${currentState.nightHoursStart}-${currentState.nightHoursEnd}`
        };
      }
      
      // Verify night hours function behavior
      const nightTime = DateTime.now().set({ hour: newStart }).toJSDate();
      const dayTime = DateTime.now().set({ hour: (newStart + 12) % 24 }).toJSDate();
      
      const nightTimeResult = isNightHours(nightTime);
      const dayTimeResult = isNightHours(dayTime);
      
      // Handle the case where night hours span midnight
      const shouldBeNight = newStart > newEnd 
        ? newStart <= nightTime.getHours() || nightTime.getHours() < newEnd
        : newStart <= nightTime.getHours() && nightTime.getHours() < newEnd;
        
      const shouldBeDay = !shouldBeNight;
      
      if (nightTimeResult !== shouldBeNight || dayTimeResult !== shouldBeDay) {
        return {
          name: 'Night Hours Setting',
          passed: false,
          details: `Night hours function not using settings correctly. Time at ${nightTime.getHours()}:00 should ${shouldBeNight ? 'be' : 'not be'} night hours, but got ${nightTimeResult}. Time at ${dayTime.getHours()}:00 should ${shouldBeDay ? 'not be' : 'be'} night hours, but got ${dayTimeResult}.`
        };
      }
      
      // Restore original values
      settings.setNightHours(originalStart, originalEnd);
      
      return {
        name: 'Night Hours Setting',
        passed: true,
        details: 'Setting updates and is reflected in night hours detection'
      };
    } catch (error) {
      // Restore original values
      settings.setNightHours(originalStart, originalEnd);
      
      return {
        name: 'Night Hours Setting',
        passed: false,
        details: `Error testing night hours: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Default View
  const testDefaultView = async (): Promise<TestResult> => {
    // Get original value
    const originalValue = settings.defaultView;
    
    try {
      // Test changing to a different view
      const views: ('analog' | 'digital' | 'list')[] = ['analog', 'digital', 'list'];
      const newValue = views.find(v => v !== originalValue) || 'analog';
      
      settings.setDefaultView(newValue);
      
      // Verify store was updated
      const currentValue = useSettingsStore.getState().defaultView;
      if (currentValue !== newValue) {
        return {
          name: 'Default View Setting',
          passed: false,
          details: `Setting not saved correctly. Expected ${newValue}, got ${currentValue}`
        };
      }
      
      // Note: Further verification would require checking the initial view on app load
      // which is beyond the scope of this component test
      
      // Restore original value
      settings.setDefaultView(originalValue);
      
      return {
        name: 'Default View Setting',
        passed: true,
        details: 'Setting updates correctly in the store'
      };
    } catch (error) {
      // Restore original value
      settings.setDefaultView(originalValue);
      
      return {
        name: 'Default View Setting',
        passed: false,
        details: `Error testing default view: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Test Notification Settings
  const testNotificationSettings = async (): Promise<TestResult> => {
    // Get original values
    const originalNotifications = settings.enableNotifications;
    const originalReminders = settings.meetingReminders;
    
    try {
      // Test toggling values
      settings.setEnableNotifications(!originalNotifications);
      settings.setMeetingReminders(!originalReminders);
      
      // Verify store was updated
      const currentState = useSettingsStore.getState();
      if (currentState.enableNotifications === originalNotifications || 
          currentState.meetingReminders === originalReminders) {
        return {
          name: 'Notification Settings',
          passed: false,
          details: 'Settings not saved correctly'
        };
      }
      
      // Note: Further verification would require triggering notifications
      // which is beyond the scope of this component test
      
      // Restore original values
      settings.setEnableNotifications(originalNotifications);
      settings.setMeetingReminders(originalReminders);
      
      return {
        name: 'Notification Settings',
        passed: true,
        details: 'Settings update correctly in the store'
      };
    } catch (error) {
      // Restore original values
      settings.setEnableNotifications(originalNotifications);
      settings.setMeetingReminders(originalReminders);
      
      return {
        name: 'Notification Settings',
        passed: false,
        details: `Error testing notification settings: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  
  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Run each test
    const testFunctions = [
      testWeekendHighlightColor,
      testTimeFormat,
      testDateFormat,
      testShowSeconds,
      testBusinessHours,
      testNightHours,
      testDefaultView,
      testNotificationSettings
    ];
    
    const allResults: TestResult[] = [];
    
    for (const testFn of testFunctions) {
      const result = await testFn();
      allResults.push(result);
      setResults([...allResults]); // Update results after each test
      
      // Small delay to allow for state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  };
  
  // Run an individual test
  const runTest = async (testFn: () => Promise<TestResult>) => {
    setIsRunning(true);
    const result = await testFn();
    setResults([result]);
    setIsRunning(false);
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Settings Verification</h2>
        <button 
          onClick={toggleExpanded}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {expanded && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={runAllTests}
              disabled={isRunning}
              className="px-3 py-1.5 bg-primary-500 text-white rounded-md"
            >
              {isRunning ? 'Testing...' : 'Verify All Settings'}
            </button>
            
            <button 
              onClick={() => runTest(testTimeFormat)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
            >
              Test Time Format
            </button>
            
            <button 
              onClick={() => runTest(testDateFormat)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
            >
              Test Date Format
            </button>
            
            <button 
              onClick={() => runTest(testShowSeconds)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
            >
              Test Show Seconds
            </button>
            
            <button 
              onClick={() => runTest(testBusinessHours)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
            >
              Test Business Hours
            </button>
            
            <button 
              onClick={() => runTest(testNightHours)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
            >
              Test Night Hours
            </button>
            
            <button 
              onClick={() => runTest(testWeekendHighlightColor)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
            >
              Test Weekend Color
            </button>
          </div>
          
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, i) => (
                <div 
                  key={i}
                  className={`p-2 rounded-md ${result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
                >
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{result.name}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {result.passed ? '✅ Working correctly' : '❌ Not working correctly'}
                    </span>
                  </div>
                  {!result.passed && <p className="text-sm text-red-600 dark:text-red-300 mt-1">{result.details}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {!expanded && results.length > 0 && (
        <div className="text-sm">
          <p>
            {results.filter(r => r.passed).length} of {results.length} settings working correctly
            {results.filter(r => !r.passed).length > 0 && 
              ` (${results.filter(r => !r.passed).length} not working)`}
          </p>
        </div>
      )}
    </div>
  );
} 