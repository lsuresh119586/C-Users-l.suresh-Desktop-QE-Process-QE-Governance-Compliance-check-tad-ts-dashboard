/**
 * Polaris Dashboard - E2E Tests
 * Spec Reference: Section 7.4 - End-to-End Testing with Playwright MCP
 * 
 * Test Coverage:
 * - Story 1: View Organization-Wide Dashboard
 * - Story 2: Drill Down into Product
 * - Navigation and filtering
 * - Metric display and calculations
 */

import { test, expect } from '@playwright/test';

test.describe('Polaris Dashboard - Organization View', () => {
  
  test('displays organization-wide metrics on initial load', async ({ page }) => {
    // Story 1: Organization view should be default homepage
    await page.goto('/');
    
    // Verify page loaded
    await expect(page.locator('text=Polaris')).toBeVisible();
    
    // Should show organization-level metrics by default
    await expect(page.getByTestId('view-level-indicator')).toContainText('Organization Level');
    await expect(page.getByTestId('view-level-indicator')).toContainText('all products and teams');
    
    // Should show metrics cards
    await expect(page.getByTestId('tad-compliance-card')).toBeVisible();
    await expect(page.getByTestId('ts-compliance-card')).toBeVisible();
    await expect(page.getByTestId('automation-card')).toBeVisible();
    
    // Should NOT show error message
    await expect(page.locator('text=No metrics found')).not.toBeVisible();
    await expect(page.locator('.ant-alert-error')).not.toBeVisible();
  });
  
  test('displays dashboard with product selector and no error on load', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loaded
    await expect(page.locator('text=Polaris')).toBeVisible();
    
    // Verify product selector is present
    await expect(page.getByTestId('product-selector')).toBeVisible();
    
    // Should NOT show error message on initial load
    await expect(page.locator('text=No metrics found')).not.toBeVisible();
  });
  
  test('shows products in dropdown', async ({ page }) => {
    await page.goto('/');
    
    // Click product dropdown
    const productSelector = page.getByTestId('product-selector');
    await productSelector.click();
    
    // Verify all 4 products are available per spec Appendix C
    await expect(page.locator('text=Passport')).toBeVisible();
    await expect(page.locator('text=Tymetrix 360')).toBeVisible();
    await expect(page.locator('text=Data & Analytics')).toBeVisible();
    await expect(page.locator('text=Collaboration Portal')).toBeVisible();
  });
});

test.describe('Polaris Dashboard - Product View', () => {
  
  test('navigates to product view when product is selected', async ({ page }) => {
    // Story 2: Drill down into product
    await page.goto('/');
    
    // Select T360 product (id: 2)
    const productSelector = page.getByTestId('product-selector');
    await productSelector.click();
    await page.locator('text=Tymetrix 360').click();
    
    // Wait for metrics to load and view level to update
    await page.waitForTimeout(1500);
    
    // Should show product-level view
    await expect(page.getByTestId('view-level-indicator')).toBeVisible();
    await expect(page.getByTestId('view-level-indicator')).toContainText('Product Level');
    
    // Team selector should now be enabled and populated
    const teamSelector = page.getByTestId('team-selector');
    await teamSelector.click();
    
    // Verify T360 teams are shown (6 teams per spec)
    await expect(page.locator('text=T360 Chubb')).toBeVisible();
    await expect(page.locator('text=T360 Vanguards')).toBeVisible();
  });
  
  test('shows metrics when team and sprint are selected', async ({ page }) => {
    await page.goto('/');
    
    // Select T360 product
    const productSelector = page.getByTestId('product-selector');
    await productSelector.click();
    await page.locator('text=Tymetrix 360').click();
    await page.waitForTimeout(500);
    
    // Select Vanguards team (id: 5)
    const teamSelector = page.getByTestId('team-selector');
    await teamSelector.click();
    await page.locator('text=T360 Vanguards').click();
    await page.waitForTimeout(500);
    
    // Select Sprint 26.1.1 (id: 1)
    const sprintSelector = page.getByTestId('sprint-selector');
    await sprintSelector.click();
    await page.locator('text=Sprint 26.1.1').click();
    
    // Wait for metrics to load
    await page.waitForTimeout(1000);
    
    // Verify sprint-level view
    await expect(page.getByTestId('view-level-indicator')).toContainText('Sprint Level');
    
    // Verify metrics are displayed (team 5, sprint 1 has data)
    await expect(page.getByTestId('tad-compliance-card')).toBeVisible();
    await expect(page.getByTestId('ts-compliance-card')).toBeVisible();
    await expect(page.getByTestId('automation-card')).toBeVisible();
  });
});

test.describe('Polaris Dashboard - Sprint Selector', () => {
  
  test('shows all 5 sprints in dropdown', async ({ page }) => {
    await page.goto('/');
    
    // Select product and team first to enable sprint selector
    const productSelector = page.getByRole('combobox').first();
    await productSelector.click();
    await page.locator('text=Tymetrix 360').click();
    await page.waitForTimeout(500);
    
    const teamSelector = page.getByRole('combobox').nth(1);
    await teamSelector.click();
    await page.locator('text=T360 Vanguards').click();
    await page.waitForTimeout(500);
    
    // Click sprint dropdown
    const sprintSelector = page.getByRole('combobox').nth(2);
    await sprintSelector.click();
    
    // Verify all 5 sprints per spec Appendix C
    await expect(page.locator('text=26.1.1')).toBeVisible();
    await expect(page.locator('text=26.1.0')).toBeVisible();
    await expect(page.locator('text=25.4.2')).toBeVisible();
    await expect(page.locator('text=25.4.1')).toBeVisible();
    await expect(page.locator('text=25.4.0')).toBeVisible();
  });
});

test.describe('Polaris Dashboard - API Integration', () => {
  
  test('successfully loads products from API', async ({ page, request }) => {
    // Verify API is responding
    const response = await request.get('http://localhost:3000/api/products');
    expect(response.ok()).toBeTruthy();
    
    const products = await response.json();
    expect(products).toHaveLength(4); // Per spec: 4 products
    
    // Verify product data structure
    expect(products[0]).toHaveProperty('id');
    expect(products[0]).toHaveProperty('code');
    expect(products[0]).toHaveProperty('name');
    expect(products[0]).toHaveProperty('displayName');
  });
  
  test('successfully loads teams from API', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/teams');
    expect(response.ok()).toBeTruthy();
    
    const teams = await response.json();
    expect(teams).toHaveLength(11); // Per spec: 11 teams
  });
  
  test('successfully loads sprints from API', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/sprints');
    expect(response.ok()).toBeTruthy();
    
    const sprints = await response.json();
    expect(sprints).toHaveLength(5); // Per spec: 5 sprints
  });
  
  test('loads team metrics from API', async ({ request }) => {
    // Team 5 (Vanguards), Sprint 1 has test data
    const response = await request.get('http://localhost:3000/api/metrics/5/1');
    expect(response.ok()).toBeTruthy();
    
    const metrics = await response.json();
    expect(metrics).toHaveProperty('tadTsMetrics');
    expect(metrics).toHaveProperty('qtestMetrics');
    expect(metrics).toHaveProperty('defectMetrics');
    
    // Verify metric structure per spec Appendix C
    expect(metrics.tadTsMetrics).toHaveProperty('totalStories');
    expect(metrics.tadTsMetrics).toHaveProperty('tadComplete');
    expect(metrics.tadTsMetrics).toHaveProperty('tadPct');
    expect(metrics.tadTsMetrics).toHaveProperty('tsComplete');
    expect(metrics.tadTsMetrics).toHaveProperty('tsPct');
  });
});

test.describe('Polaris Dashboard - Data Validation', () => {
  
  test('displays correct product name without Client Automation suffix', async ({ page }) => {
    await page.goto('/');
    
    const productSelector = page.getByRole('combobox').first();
    await productSelector.click();
    
    // Per spec fix: Should show "Passport", not "Passport Client Automation"
    const passportOption = page.locator('text=Passport').first();
    await expect(passportOption).toBeVisible();
    
    // Should NOT show the old name
    await expect(page.locator('text=Passport Client Automation')).not.toBeVisible();
  });
});
