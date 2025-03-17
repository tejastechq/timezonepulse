import { test, expect } from '@playwright/test';

test('ListView page renders correctly', async ({ page }) => {
  // Navigate to the list view page
  await page.goto('/list-view');
  
  // Check if the page title is rendered
  await expect(page.locator('h1')).toHaveText('World Clock - List View');
  
  // Check if timezones are displayed
  await expect(page.locator('div:has-text("New York")')).toBeVisible();
  await expect(page.locator('div:has-text("London")')).toBeVisible();
  await expect(page.locator('div:has-text("Tokyo")')).toBeVisible();
  
  // Test view switching
  await page.click('text=Week');
  // Verify something specific to week view is displayed
  
  // Test navigation
  await page.click('[aria-label="Next day or week"]');
  // Verify date has changed
  
  // Test time slot selection
  await page.click('.cursor-pointer >> nth=3'); // Click a time slot
  // Verify meeting planner appears
  await expect(page.locator('text=Meeting Planner')).toBeVisible();
  
  // Test clearing selection
  await page.click('text=Clear Selection');
  await expect(page.locator('text=Meeting Planner')).not.toBeVisible();
}); 