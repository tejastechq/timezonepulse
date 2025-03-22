# Settings Verification System

## Overview

The Settings Verification system provides a way to test and validate that all settings in the World Clock application are working correctly. It ensures that:

1. Settings can be changed and saved to the store
2. The UI reflects the changes made to settings
3. Helper functions respect the current settings values

## How to Use

The Settings Verifier is automatically included in the Settings page when running in development mode. To access it:

1. Start the application in development mode (`npm run dev`)
2. Navigate to the Settings page
3. Scroll to the bottom of the page to find the Settings Verification panel
4. Click "Expand" to show the testing interface
5. Click "Verify All Settings" to run all tests, or use individual test buttons

## Tested Settings

The verifier tests the following settings:

### Appearance Settings
- **Weekend Highlight Color**: Tests changing the color and verifies that the correct CSS classes are applied
- **Default View**: Tests changing the default view (analog, digital, list)

### Time Display Settings
- **Time Format**: Tests toggling between 12h and 24h time formats and ensures time display changes accordingly
- **Date Format**: Tests changing between MM/DD/YYYY, DD/MM/YYYY, and YYYY-MM-DD formats
- **Show Seconds**: Tests enabling/disabling seconds in time displays
- **Business Hours**: Tests changing business hours start and end times, and verifies the `isBusinessHours()` function behavior
- **Night Hours**: Tests changing night hours start and end times, and verifies the `isNightHours()` function behavior

### Notification Settings
- **Enable Notifications**: Tests toggling notification settings
- **Meeting Reminders**: Tests toggling meeting reminder settings

## Test Results

Each test will display a result:
- ✅ Green: The setting is working correctly
- ❌ Red: The setting is not working correctly, with details about the issue

## Extending the Verifier

To add tests for new settings:

1. Open `components/dev/SettingsVerifier.tsx`
2. Create a new test function following the pattern of existing tests
3. Add the test function to the `testFunctions` array in the `runAllTests` function
4. Add a button for the individual test if desired

## Troubleshooting

If a test fails, check:
1. The setting's implementation in `store/settingsStore.ts`
2. The setting's usage in relevant components
3. Helper functions in `lib/utils/dateTimeFormatter.ts` or other utility files

Remember to revert any test changes to settings after testing to maintain your preferred configuration. 