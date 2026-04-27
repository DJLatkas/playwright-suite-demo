import { test, expect } from '../../src/fixtures';
import {
  runA11yScan,
  formatViolations,
  violationsByImpact,
} from '../../src/utils/accessibility';

test.describe('Accessibility — Login page', () => {
  test.use({ project: 'chromium' } as object);

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('has no critical or serious violations (WCAG 2.1 AA)', { tag: ['@regression', '@a11y', '@auth'] }, async ({ page }) => {
    const result = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
    const blocking = violationsByImpact(result.violations, 'critical', 'serious');
    expect(
      blocking,
      `Blocking violations found:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });

  test('all form inputs have associated labels', { tag: ['@regression', '@a11y', '@auth'] }, async ({ page }) => {
    const result = await runA11yScan(page, { include: ['form'], tags: ['wcag2a'] });
    const labelViolations = result.violations.filter(v => v.id === 'label');
    expect(
      labelViolations,
      `Label violations:\n${formatViolations(labelViolations)}`
    ).toHaveLength(0);
  });

  test('color contrast meets WCAG AA threshold', { tag: ['@regression', '@a11y', '@auth'] }, async ({ page }) => {
    const result = await runA11yScan(page, { tags: ['wcag2aa'] });
    const contrastViolations = result.violations.filter(v => v.id === 'color-contrast');
    expect(
      contrastViolations,
      `Contrast violations:\n${formatViolations(contrastViolations)}`
    ).toHaveLength(0);
  });

  test('interactive elements are keyboard-accessible', { tag: ['@regression', '@a11y', '@auth'] }, async ({ page }) => {
    const result = await runA11yScan(page, { tags: ['wcag2a'] });
    const keyboardViolations = result.violations.filter(v =>
      ['tabindex', 'focusable-disabled', 'focus-trap'].includes(v.id)
    );
    expect(
      keyboardViolations,
      `Keyboard violations:\n${formatViolations(keyboardViolations)}`
    ).toHaveLength(0);
  });

  test('error state introduces no new violations', { tag: ['@regression', '@a11y', '@auth'] }, async ({ loginPage, page }) => {
    await loginPage.login('wrong', 'wrong');
    await loginPage.expectError();
    const result = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa'] });
    const blocking = violationsByImpact(result.violations, 'critical', 'serious');
    expect(
      blocking,
      `Error state blocking violations:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });

  test('page has a valid document structure (landmark, heading)', { tag: ['@regression', '@a11y', '@auth'] }, async ({ page }) => {
    const result = await runA11yScan(page, { tags: ['best-practice'] });
    const structureViolations = result.violations.filter(v =>
      ['landmark-one-main', 'page-has-heading-one', 'region'].includes(v.id)
    );
    expect(
      structureViolations,
      `Structure violations:\n${formatViolations(structureViolations)}`
    ).toHaveLength(0);
  });
});

test.describe('Accessibility — Dashboard', () => {
  test.use({ project: 'chromium' } as object);

  test('dashboard has no critical or serious violations', { tag: ['@regression', '@a11y', '@dashboard'] }, async ({ authenticatedDashboard: _dashboard, page }) => {
    // Wait for table data to render
    await page.waitForSelector('[data-testid="user-row"]');
    const result = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
    const blocking = violationsByImpact(result.violations, 'critical', 'serious');
    expect(
      blocking,
      `Dashboard blocking violations:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });

  test('add-user modal has no critical violations', { tag: ['@regression', '@a11y', '@dashboard'] }, async ({ authenticatedDashboard: dash, page }) => {
    await dash.addUserButton.click();
    await expect(dash.modal).toBeVisible();
    const result = await runA11yScan(page, {
      include: ['[data-testid="user-modal"]'],
      tags: ['wcag2a', 'wcag2aa'],
    });
    const blocking = violationsByImpact(result.violations, 'critical', 'serious');
    expect(
      blocking,
      `Modal blocking violations:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });
});
