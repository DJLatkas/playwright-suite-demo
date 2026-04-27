import * as fs from 'fs';
import { test, expect } from '../../src/fixtures';
import { uniqueEmail } from '../../src/utils/testData';
import {
  runA11yScan,
  formatViolations,
  violationsByImpact,
} from '../../src/utils/accessibility';

test.describe('Reports Page', () => {
  test('unauthenticated visit redirects to login', { tag: ['@smoke', '@auth', '@reports'] }, async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/login/);
  });

  test('summary cards show correct counts matching seeded data', { tag: ['@smoke', '@reports'] }, async ({
    authenticatedReports: reports,
  }) => {
    await expect(reports.summaryTotal).not.toHaveText('—');
    const total    = await reports.getSummaryTotal();
    const active   = await reports.getSummaryActive();
    const inactive = parseInt((await reports.summaryInactive.textContent()) ?? '0', 10);
    expect(total).toBeGreaterThanOrEqual(3);
    expect(active + inactive).toBe(total);
  });

  test('role breakdown bars are all visible and non-zero for seeded data', { tag: ['@regression', '@reports'] }, async ({
    authenticatedReports: reports,
    page,
  }) => {
    // Seeded data has Admin, Editor, Viewer — each bar should be visible
    for (const role of ['Admin', 'Editor', 'Viewer']) {
      await expect(page.getByTestId(`role-bar-${role}`)).toBeVisible();
      const pct = await reports.getRoleBarPct(role);
      expect(pct).toBeGreaterThan(0);
    }
  });

  test('adding a user via API then reloading updates summary counts', { tag: ['@regression', '@reports'] }, async ({
    authenticatedReports: reports,
    authedApi,
    page,
  }) => {
    const totalBefore = await reports.getSummaryTotal();
    await authedApi.createUser({
      name:   'Reports Test User',
      email:  uniqueEmail('reports-add'),
      role:   'Viewer',
      status: 'Active',
    });

    await page.reload();
    await page.waitForSelector('[data-testid="reports-stat-total"]');
    await expect(reports.summaryTotal).not.toHaveText('—');

    const totalAfter = await reports.getSummaryTotal();
    expect(totalAfter).toBeGreaterThanOrEqual(totalBefore + 1);
  });

  test('activity log shows an entry after an add action', { tag: ['@regression', '@reports'] }, async ({
    authenticatedReports: _reports,
    authedApi,
    page,
  }) => {
    const name = `Activity Log User ${Date.now()}`;
    await authedApi.createUser({
      name,
      email:  uniqueEmail('activity'),
      role:   'Viewer',
      status: 'Active',
    });

    await page.reload();
    await page.waitForSelector('[data-testid="activity-log"]');

    // Find the specific entry for the user we created (parallel-safe)
    const entry = page.getByTestId('activity-entry').filter({ hasText: name });
    await expect(entry).toBeVisible();
    await expect(entry).toContainText('add');
  });

  test('date range filter hides entries outside the range', { tag: ['@regression', '@reports', '@filter'] }, async ({
    authenticatedReports: reports,
    authedApi,
    page,
  }) => {
    // Ensure there is at least one log entry
    await authedApi.createUser({
      name:   `Date Filter User ${Date.now()}`,
      email:  uniqueEmail('date-filter'),
      role:   'Editor',
      status: 'Active',
    });

    await page.reload();
    await page.waitForSelector('[data-testid="activity-entry"]');

    // Set "from" to tomorrow — all today's entries should vanish
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    await reports.dateFrom.fill(tomorrowStr);
    await expect(page.getByTestId('activity-entry')).toHaveCount(0);

    // Clear the filter and entries return
    await reports.dateFrom.fill('');
    await expect(page.getByTestId('activity-entry').first()).toBeVisible();
  });

  test('Export CSV button downloads a file with correct headers', { tag: ['@regression', '@reports'] }, async ({
    authenticatedReports: reports,
    page,
  }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      reports.exportButton.click(),
    ]);

    expect(download.suggestedFilename()).toBe('users.csv');

    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const content = fs.readFileSync(filePath!, 'utf-8');
    expect(content).toMatch(/^id,name,email,role,status/);
    // At least one data row beyond the header
    const lines = content.trim().split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  test('mocked empty summary shows graceful zero state', { tag: ['@regression', '@reports'] }, async ({
    authenticatedReports: _reports,
    page,
  }) => {
    await page.route('**/api/reports/summary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, active: 0, inactive: 0, byRole: { Admin: 0, Editor: 0, Viewer: 0 } }),
      });
    });

    await page.reload();
    await page.waitForSelector('[data-testid="reports-stat-total"]');

    await expect(page.getByTestId('reports-stat-total')).toHaveText('0');
    await expect(page.getByTestId('reports-stat-active')).toHaveText('0');
    await expect(page.getByTestId('reports-stat-inactive')).toHaveText('0');
    // Page should not crash
    await expect(page).not.toHaveURL(/error/);

    await page.unroute('**/api/reports/summary');
  });

  test('reports page has no critical or serious accessibility violations', { tag: ['@regression', '@a11y', '@reports'] }, async ({
    authenticatedReports: _reports,
    page,
  }) => {
    await expect(page.getByTestId('reports-stat-total')).not.toHaveText('—');
    const result = await runA11yScan(page, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    });
    const blocking = violationsByImpact(result.violations, 'critical', 'serious');
    expect(
      blocking,
      `Blocking violations found:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });
});
