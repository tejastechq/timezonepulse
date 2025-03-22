# Testing World Clock Application

This directory contains tests for the World Clock application.

## Running tests

You can run all tests by using:

```bash
pnpm test
```

Or to run tests in watch mode (automatically re-run on changes):

```bash
pnpm test:watch
```

To run a specific test file:

```bash
pnpm test -- tests/analog-clock.test.tsx
```

## Analog Clock Tests

The `analog-clock.test.tsx` file contains tests to verify that the analog clock correctly displays time in different timezones. These tests:

1. Check that the clock hands are correctly positioned for a specific time in New York timezone
2. Check that the clock hands are correctly positioned for a specific time in Tokyo timezone
3. Verify that the clock updates correctly when the timezone changes

The tests use a fixed time (noon UTC on June 15, 2023) to ensure consistent test results. 