import { test, expect } from '../../src/fixtures';

test.describe('Controls Playground', () => {

  test('unauthenticated visit redirects to login', { tag: ['@smoke', '@auth', '@controls'] }, async ({ page }) => {
    await page.goto('/controls');
    await expect(page).toHaveURL(/login/);
  });

  // ── Sliders ──────────────────────────────────────────────────────────────

  test('slider value display updates as slider moves', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.setSliderValue('slider-brightness', 75);
    await expect(ctrl.sliderBrightnessValue).toHaveText('75');

    await ctrl.setSliderValue('slider-volume', 20);
    await expect(ctrl.sliderVolumeValue).toHaveText('20');

    await ctrl.setSliderValue('slider-opacity', 0);
    await expect(ctrl.sliderOpacityValue).toHaveText('0');
  });

  test('sliders accept min and max boundary values', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.setSliderValue('slider-brightness', 0);
    await expect(ctrl.sliderBrightnessValue).toHaveText('0');

    await ctrl.setSliderValue('slider-brightness', 100);
    await expect(ctrl.sliderBrightnessValue).toHaveText('100');
  });

  test('all three sliders start with distinct default values', { tag: ['@smoke', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    const brightness = await ctrl.getSliderValue('slider-brightness');
    const volume     = await ctrl.getSliderValue('slider-volume');
    const opacity    = await ctrl.getSliderValue('slider-opacity');
    expect(brightness).toBe(60);
    expect(volume).toBe(40);
    expect(opacity).toBe(80);
  });

  // ── Toggles ──────────────────────────────────────────────────────────────

  test('clicking a toggle flips its aria-checked state', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    // Notifications starts ON
    await expect(ctrl.toggleNotifications).toHaveAttribute('aria-checked', 'true');
    await ctrl.toggleNotifications.click();
    await expect(ctrl.toggleNotifications).toHaveAttribute('aria-checked', 'false');

    // Dark mode starts OFF
    await expect(ctrl.toggleDarkmode).toHaveAttribute('aria-checked', 'false');
    await ctrl.toggleDarkmode.click();
    await expect(ctrl.toggleDarkmode).toHaveAttribute('aria-checked', 'true');
  });

  test('toggles are independently controlled', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.toggleNotifications.click(); // OFF
    await ctrl.toggleAutosave.click();      // OFF
    await expect(ctrl.toggleNotifications).toHaveAttribute('aria-checked', 'false');
    await expect(ctrl.toggleAutosave).toHaveAttribute('aria-checked', 'false');
    // Marketing is still OFF (unchanged)
    await expect(ctrl.toggleMarketing).toHaveAttribute('aria-checked', 'false');
  });

  test('toggle can be cycled on–off–on', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.toggleNotifications.click();
    await expect(ctrl.toggleNotifications).toHaveAttribute('aria-checked', 'false');
    await ctrl.toggleNotifications.click();
    await expect(ctrl.toggleNotifications).toHaveAttribute('aria-checked', 'true');
  });

  // ── Checkboxes ───────────────────────────────────────────────────────────

  test('select-all checks every feature checkbox', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    // First ensure not all are checked (api and 2fa start unchecked)
    await expect(ctrl.checkboxApi).not.toBeChecked();
    await ctrl.checkboxSelectAll.check();
    await expect(ctrl.checkboxAnalytics).toBeChecked();
    await expect(ctrl.checkboxExport).toBeChecked();
    await expect(ctrl.checkboxApi).toBeChecked();
    await expect(ctrl.checkbox2fa).toBeChecked();
    await expect(ctrl.checkboxCount).toHaveText('4');
  });

  test('unchecking select-all clears all feature checkboxes', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.checkboxSelectAll.check();
    await ctrl.checkboxSelectAll.uncheck();
    await expect(ctrl.checkboxAnalytics).not.toBeChecked();
    await expect(ctrl.checkboxExport).not.toBeChecked();
    await expect(ctrl.checkboxApi).not.toBeChecked();
    await expect(ctrl.checkbox2fa).not.toBeChecked();
    await expect(ctrl.checkboxCount).toHaveText('0');
  });

  test('checkbox count updates as individual boxes are checked', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    // Start: analytics + export checked = 2
    await expect(ctrl.checkboxCount).toHaveText('2');

    await ctrl.checkboxApi.check();
    await expect(ctrl.checkboxCount).toHaveText('3');

    await ctrl.checkbox2fa.check();
    await expect(ctrl.checkboxCount).toHaveText('4');

    await ctrl.checkboxAnalytics.uncheck();
    await expect(ctrl.checkboxCount).toHaveText('3');
  });

  // ── Radio buttons ─────────────────────────────────────────────────────────

  test('selecting a plan radio updates the selection display', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await expect(ctrl.planSelection).toHaveText('Pro');

    await ctrl.radioPlanFree.check();
    await expect(ctrl.planSelection).toHaveText('Free');

    await ctrl.radioPlanEnterprise.check();
    await expect(ctrl.planSelection).toHaveText('Enterprise');
  });

  test('only one plan radio can be selected at a time', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.radioPlanFree.check();
    await ctrl.radioPlanPro.check();
    await expect(ctrl.radioPlanFree).not.toBeChecked();
    await expect(ctrl.radioPlanPro).toBeChecked();
    await expect(ctrl.radioPlanEnterprise).not.toBeChecked();
  });

  test('priority radio group works independently of plan group', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.radioPriorityHigh.check();
    await expect(ctrl.prioritySelection).toHaveText('High');
    // Plan group should be unchanged
    await expect(ctrl.planSelection).toHaveText('Pro');
  });

  // ── Selects ───────────────────────────────────────────────────────────────

  test('selecting a timezone updates the output display', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.selectTimezone.selectOption('pst');
    await expect(ctrl.timezoneOutput).toHaveText('Pacific (PST/PDT)');
  });

  test('selecting a currency updates the output display', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.selectCurrency.selectOption('eur');
    await expect(ctrl.currencyOutput).toHaveText('EUR — Euro');
  });

  // ── Textarea counter ──────────────────────────────────────────────────────

  test('textarea character count updates as text is typed', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.textareaBio.fill('Hello');
    await expect(ctrl.charCurrent).toHaveText('5');
    await expect(ctrl.charsRemaining).toHaveText('195 left');
  });

  test('warning message appears when near character limit', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    // Fill to 80% threshold (160 chars)
    const text = 'x'.repeat(161);
    await ctrl.textareaBio.fill(text);
    await expect(ctrl.charWarning).toBeVisible();
    await expect(ctrl.charWarning).toContainText('remaining');
  });

  test('character bar reaches full width at limit', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.textareaBio.fill('x'.repeat(200));
    const width = await ctrl.charBar.evaluate(el => (el as HTMLElement).style.width);
    expect(width).toBe('100%');
    await expect(ctrl.charWarning).toContainText('limit reached');
  });

  // ── Stepper ───────────────────────────────────────────────────────────────

  test('increment button increases the stepper value', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await expect(ctrl.stepperValue).toHaveText('1');
    await ctrl.stepperIncrement.click();
    await expect(ctrl.stepperValue).toHaveText('2');
    await ctrl.stepperIncrement.click();
    await expect(ctrl.stepperValue).toHaveText('3');
  });

  test('decrement button is disabled at minimum value', { tag: ['@smoke', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await expect(ctrl.stepperDecrement).toBeDisabled();
  });

  test('decrement button decreases the stepper value', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.stepperIncrement.click();
    await ctrl.stepperIncrement.click();
    await expect(ctrl.stepperValue).toHaveText('3');
    await ctrl.stepperDecrement.click();
    await expect(ctrl.stepperValue).toHaveText('2');
  });

  test('stepper stays within min/max bounds', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
    page,
  }) => {
    // Jump to 98 via JS so we don't need 98 clicks
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.stepperVal = 98;
      w.renderStepper();
    });
    await expect(ctrl.stepperValue).toHaveText('98');
    await expect(ctrl.stepperIncrement).toBeEnabled();

    // One more click hits the max
    await ctrl.stepperIncrement.click();
    await expect(ctrl.stepperValue).toHaveText('99');
    await expect(ctrl.stepperIncrement).toBeDisabled();

    // Decrement once — button re-enables
    await ctrl.stepperDecrement.click();
    await expect(ctrl.stepperValue).toHaveText('98');
    await expect(ctrl.stepperIncrement).toBeEnabled();
  });

  // ── Accordion ─────────────────────────────────────────────────────────────

  test('accordion items start closed', { tag: ['@smoke', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await expect(ctrl.accordion(1)).not.toHaveAttribute('open');
    await expect(ctrl.accordion(2)).not.toHaveAttribute('open');
    await expect(ctrl.accordion(3)).not.toHaveAttribute('open');
    await expect(ctrl.accordion(4)).not.toHaveAttribute('open');
  });

  test('clicking an accordion trigger opens that item', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.accordionTrigger(1).click();
    await expect(ctrl.accordion(1)).toHaveAttribute('open');
    await expect(ctrl.accordionContent(1)).toBeVisible();
  });

  test('opening one accordion closes the previously open one', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.accordionTrigger(1).click();
    await expect(ctrl.accordion(1)).toHaveAttribute('open');

    await ctrl.accordionTrigger(2).click();
    await expect(ctrl.accordion(2)).toHaveAttribute('open');
    await expect(ctrl.accordion(1)).not.toHaveAttribute('open');
  });

  test('clicking an open accordion trigger closes it', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    await ctrl.accordionTrigger(3).click();
    await expect(ctrl.accordion(3)).toHaveAttribute('open');
    await ctrl.accordionTrigger(3).click();
    await expect(ctrl.accordion(3)).not.toHaveAttribute('open');
  });

  // ── Drag to sort ──────────────────────────────────────────────────────────

  test('sortable list renders all 5 items in default order', { tag: ['@smoke', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    const order = await ctrl.getSortableOrder();
    expect(order).toEqual([
      'Unit Testing',
      'Integration Testing',
      'End-to-End Testing',
      'Accessibility Testing',
      'Performance Testing',
    ]);
  });

  test('dragging an item to a new position reorders the list', { tag: ['@regression', '@controls'] }, async ({
    authenticatedControls: ctrl,
  }) => {
    const items = ctrl.sortableItems();
    // Drag "Unit Testing" (item 0) onto "End-to-End Testing" (item 2)
    await items.nth(0).dragTo(items.nth(2));

    const order = await ctrl.getSortableOrder();
    // "Unit Testing" should now appear after its drop target
    const unitIdx = order.findIndex(t => t.includes('Unit Testing'));
    const e2eIdx  = order.findIndex(t => t.includes('End-to-End Testing'));
    expect(unitIdx).toBeGreaterThan(e2eIdx);
  });

});
