import { test, expect } from '@playwright/test';

test.describe('Core Application Smoke Tests', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');

    // Dashboard page should load
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Navigate to Drifts
    await page.click('text=Drifts');
    await expect(page.locator('text=Drifts')).toBeVisible();
    await expect(page).toHaveURL(/.*drifts/);

    // Navigate to Actions
    await page.click('text=Actions');
    await expect(page.locator('text=Actions')).toBeVisible();
    await expect(page).toHaveURL(/.*actions/);

    // Navigate to Audit
    await page.click('text=Audit');
    await expect(page.locator('text=Audit Log')).toBeVisible();
    await expect(page).toHaveURL(/.*audit/);

    // Navigate to Graph
    await page.click('text=Graph');
    await expect(page.locator('text=Infrastructure Graph')).toBeVisible();
    await expect(page).toHaveURL(/.*graph/);

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page).toHaveURL(/.*\//);
  });

  test('should display dashboard summary cards', async ({ page }) => {
    await page.goto('/');

    // Check that summary cards are present
    await expect(page.locator('text=Open Drifts')).toBeVisible();
    await expect(page.locator('text=Critical Issues')).toBeVisible();
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Resolved')).toBeVisible();
  });

  test('should display recent drifts and actions on dashboard', async ({ page }) => {
    await page.goto('/');

    // Check for recent drifts section
    await expect(page.locator('text=Recent Open Drifts')).toBeVisible();

    // Check for pending actions section
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
  });

  test('should handle error state gracefully when backend is down', async ({ page }) => {
    // Mock API to fail
    await page.route('**/api/**', route => route.abort());

    await page.goto('/');

    // Should show error message
    await expect(page.locator('text=/Failed to load dashboard data/i')).toBeVisible();
  });
});
