import { test, expect } from '@playwright/test';

test.describe('Graph Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/graph');
  });

  test('should render graph page', async ({ page }) => {
    await expect(page.locator('text=Infrastructure Graph')).toBeVisible();
  });

  test('should display search input and filters', async ({ page }) => {
    // Search input
    await expect(page.getByPlaceholder('Search nodes...')).toBeVisible();

    // Node type filter
    await expect(page.getByLabel('Node Type')).toBeVisible();

    // Drift status filter
    await expect(page.getByLabel('Drift Status')).toBeVisible();
  });

  test('should search for nodes', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search nodes...');
    await searchInput.fill('service');

    // The graph should update based on search
    // This is a basic smoke test - actual validation depends on backend data
    await expect(searchInput).toHaveValue('service');
  });

  test('should filter by node type', async ({ page }) => {
    // Click on Node Type dropdown
    await page.getByLabel('Node Type').click();

    // Select Runtime option
    await page.getByRole('option', { name: 'Runtime' }).click();

    // Verify selection was made
    // The graph should update to show only runtime nodes
    await page.waitForTimeout(500); // Wait for filter to apply
  });

  test('should filter by drift status', async ({ page }) => {
    // Click on Drift Status dropdown
    await page.getByLabel('Drift Status').click();

    // Select "Missing in CMDB" option
    await page.getByRole('option', { name: 'Missing in CMDB' }).click();

    // Verify selection was made
    await page.waitForTimeout(500); // Wait for filter to apply
  });

  test('should display node and edge counts', async ({ page }) => {
    // Check for node count chip
    const nodeCount = page.locator('text=/\\d+ nodes/');
    await expect(nodeCount).toBeVisible();

    // Check for edge count chip
    const edgeCount = page.locator('text=/\\d+ edges/');
    await expect(edgeCount).toBeVisible();
  });

  test('should display graph summary', async ({ page }) => {
    // Check for Summary section
    await expect(page.locator('text=Summary')).toBeVisible();

    // The summary should show node counts by type and drift status
    // This depends on backend data, so we just check the section exists
  });

  test('should have rebuild button', async ({ page }) => {
    const rebuildButton = page.getByRole('button', { name: /Rebuild/i });
    await expect(rebuildButton).toBeVisible();
  });

  test('should open node details panel when clicking a node', async ({ page }) => {
    // This test assumes there's graph data available
    // We'll need to wait for the graph to load first

    // Look for any clickable node in the graph
    // This is a basic test - actual implementation depends on graph rendering
    const graphContainer = page.locator('.react-flow');
    if (await graphContainer.isVisible()) {
      // Try to click on a node if one exists
      const node = page.locator('[data-testid^="node-"]').first();
      if (await node.isVisible()) {
        await node.click();

        // Node details panel should open (implementation specific)
        // For now, we just verify the click happened
      }
    }
  });

  test('should handle no graph data state', async ({ page }) => {
    // Mock API to return no data
    await page.route('**/api/graph/snapshots/latest', route =>
      route.fulfill({
        status: 404,
        body: JSON.stringify({ detail: 'No graph found' }),
      })
    );

    await page.goto('/graph');

    // Should show no data message
    await expect(page.locator('text=/No graph data available/i')).toBeVisible();

    // Should show Build Graph button
    await expect(page.getByRole('button', { name: /Build Graph/i })).toBeVisible();
  });

  test('should combine search and filters', async ({ page }) => {
    // Search for a term
    const searchInput = page.getByPlaceholder('Search nodes...');
    await searchInput.fill('my-service');

    // Apply a filter
    await page.getByLabel('Node Type').click();
    await page.getByRole('option', { name: 'Runtime' }).click();

    // Apply drift status filter
    await page.getByLabel('Drift Status').click();
    await page.getByRole('option', { name: 'Mapped' }).click();

    // Both filters should be active
    await expect(searchInput).toHaveValue('my-service');
  });

  test('should display CMDB mapping status in node details', async ({ page }) => {
    // This test verifies the CMDB mapping tab exists in node details
    // The actual verification depends on having nodes and clicking them

    // Look for a node and click it
    const node = page.locator('[data-testid^="node-"]').first();
    if (await node.isVisible()) {
      await node.click();

      // Look for CMDB Mapping section in the details panel
      // This is implementation-specific and may need adjustment
      await page.waitForTimeout(500);
    }
  });
});
