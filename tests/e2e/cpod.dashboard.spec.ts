import { test, expect } from '@playwright/test';

test.describe('CPOD dashboard behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:3000/api/products', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'passport', name: 'Passport' },
          { id: 't360', name: 'T360' }
        ])
      });
    });

    await page.route('http://localhost:3000/api/teams**', async (route) => {
      const url = new URL(route.request().url());
      const product = url.searchParams.get('product');

      const teams = product === 'passport'
        ? [
            { id: 'team-a', name: 'Team A', product: 'passport' },
            { id: 'cpod', name: 'CPOD', product: 'passport' }
          ]
        : [{ id: 'vanguards', name: 'Vanguards', product: 't360' }];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teams)
      });
    });

    await page.route('http://localhost:3000/api/sprints**', async (route) => {
      const url = new URL(route.request().url());
      const team = url.searchParams.get('team');

      const sprints = team === 'team-a'
        ? [{ id: 'team-a-26.1.1', name: 'Sprint 26.1.1', team: 'team-a' }]
        : [{ id: 'vanguards-26.1.1', name: 'Sprint 26.1.1', team: 'vanguards' }];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sprints)
      });
    });
  });

  test('renders Open/Closed Cards Count only for CPOD and hides Open/Closed Defects cards for CPOD', async ({ page }) => {
    await page.route('http://localhost:3000/api/metrics**', async (route) => {
      const url = new URL(route.request().url());
      const team = url.searchParams.get('team');

      if (team === 'cpod') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            product: 'passport',
            team: 'cpod',
            openCardsCount: 6,
            closedCardsCount: 4,
            defectsOpen: 1,
            defectsClosed: 4,
            requirementsCovered: 90,
            testsCovered: 92,
            deploymentReadiness: 89,
            codeQuality: 91,
            reopenedRate: 0,
            cpodDataUnavailable: false
          }])
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          product: 'passport',
          team: 'team-a',
          defectsOpen: 2,
          defectsClosed: 5,
          requirementsCovered: 88,
          testsCovered: 86,
          deploymentReadiness: 84,
          codeQuality: 87,
          reopenedRate: 10
        }])
      });
    });

    await page.goto('/');

    await expect(page.locator('text=🚨 Open Defects')).toBeVisible();
    await expect(page.locator('text=✓ Closed Defects')).toBeVisible();
    await expect(page.locator('text=📂 Open Cards Count')).toHaveCount(0);
    await expect(page.locator('text=🧾 Closed Cards Count')).toHaveCount(0);

    await page.selectOption('#team', 'cpod');

    await expect(page.locator('text=📂 Open Cards Count')).toBeVisible();
    await expect(page.locator('text=🧾 Closed Cards Count')).toBeVisible();
    await expect(page.locator('text=🚨 Open Defects')).toHaveCount(0);
    await expect(page.locator('text=✓ Closed Defects')).toHaveCount(0);

    await page.selectOption('#team', '');

    await expect(page.locator('text=📂 Open Cards Count')).toHaveCount(0);
    await expect(page.locator('text=🧾 Closed Cards Count')).toHaveCount(0);
  });

  test('refreshes CPOD metric when date changes and sends startDate/endDate params', async ({ page }) => {
    const requestedRanges: Array<{ startDate: string | null; endDate: string | null }> = [];

    await page.route('http://localhost:3000/api/metrics**', async (route) => {
      const url = new URL(route.request().url());
      const team = url.searchParams.get('team');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      if (team === 'cpod') {
        requestedRanges.push({ startDate, endDate });
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          product: 'passport',
          team: team || 'team-a',
          openCardsCount: 8,
          closedCardsCount: 3,
          defectsOpen: 1,
          defectsClosed: 3,
          requirementsCovered: 90,
          testsCovered: 90,
          deploymentReadiness: 90,
          codeQuality: 90,
          reopenedRate: 0,
          cpodDataUnavailable: false
        }])
      });
    });

    await page.goto('/');
    await page.selectOption('#team', 'cpod');

    await page.fill('#cpodStartDate', '2026-03-01');
    await page.locator('#cpodStartDate').blur();
    await page.fill('#cpodEndDate', '2026-03-04');
    await page.locator('#cpodEndDate').blur();

    await expect.poll(() => requestedRanges.some(
      (entry) => entry.startDate === '2026-03-01' && entry.endDate === '2026-03-04'
    )).toBeTruthy();
  });

  test('shows no-match 0 and fallback Data unavailable without breaking other cards', async ({ page }) => {
    await page.route('http://localhost:3000/api/metrics**', async (route) => {
      const url = new URL(route.request().url());
      const team = url.searchParams.get('team');
      const startDate = url.searchParams.get('startDate');

      if (team === 'cpod' && startDate === '2026-03-02') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            product: 'passport',
            team: 'cpod',
            openCardsCount: 0,
            closedCardsCount: 0,
            defectsOpen: 0,
            defectsClosed: 0,
            requirementsCovered: 90,
            testsCovered: 90,
            deploymentReadiness: 90,
            codeQuality: 90,
            reopenedRate: 0,
            cpodDataUnavailable: false
          }])
        });
        return;
      }

      if (team === 'cpod' && startDate === '2026-03-03') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            product: 'passport',
            team: 'cpod',
            openCardsCount: 0,
            closedCardsCount: 0,
            defectsOpen: 1,
            defectsClosed: 0,
            requirementsCovered: 90,
            testsCovered: 90,
            deploymentReadiness: 90,
            codeQuality: 90,
            reopenedRate: 0,
            cpodDataUnavailable: true
          }])
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          product: 'passport',
          team: team || 'team-a',
          openCardsCount: 2,
          defectsOpen: 1,
          defectsClosed: 2,
          requirementsCovered: 90,
          testsCovered: 90,
          deploymentReadiness: 90,
          codeQuality: 90,
          reopenedRate: 0,
          cpodDataUnavailable: false,
          closedCardsCount: 2
        }])
      });
    });

    await page.goto('/');
    await page.selectOption('#team', 'cpod');

    await page.fill('#cpodStartDate', '2026-03-02');
    await page.locator('#cpodStartDate').blur();
    await page.fill('#cpodEndDate', '2026-03-02');
    await page.locator('#cpodEndDate').blur();

    await expect(page.locator('#cpodOpenCardsCard .metric-value')).toHaveText('0');
    await expect(page.locator('#cpodClosedCardsCard .metric-value')).toHaveText('0');

    await page.fill('#cpodStartDate', '2026-03-03');
    await page.locator('#cpodStartDate').blur();
    await page.fill('#cpodEndDate', '2026-03-03');
    await page.locator('#cpodEndDate').blur();

    await expect(page.locator('#cpodOpenCardsCard .metric-value')).toHaveText('Data unavailable');
    await expect(page.locator('#cpodClosedCardsCard .metric-value')).toHaveText('Data unavailable');
    await expect(page.locator('text=↩️ Reopened Defects')).toBeVisible();
    await expect(page.locator('text=🚀 DoD Completion/Release Readiness %')).toBeVisible();
  });
});
