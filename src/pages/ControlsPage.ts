import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class ControlsPage extends BasePage {
  readonly sliderBrightness:      Locator;
  readonly sliderBrightnessValue: Locator;
  readonly sliderVolume:          Locator;
  readonly sliderVolumeValue:     Locator;
  readonly sliderOpacity:         Locator;
  readonly sliderOpacityValue:    Locator;

  readonly toggleNotifications: Locator;
  readonly toggleAutosave:      Locator;
  readonly toggleDarkmode:      Locator;
  readonly toggleMarketing:     Locator;

  readonly checkboxSelectAll: Locator;
  readonly checkboxAnalytics: Locator;
  readonly checkboxExport:    Locator;
  readonly checkboxApi:       Locator;
  readonly checkbox2fa:       Locator;
  readonly checkboxCount:     Locator;

  readonly radioPlanFree:       Locator;
  readonly radioPlanPro:        Locator;
  readonly radioPlanEnterprise: Locator;
  readonly planSelection:       Locator;
  readonly radioPriorityLow:    Locator;
  readonly radioPriorityMedium: Locator;
  readonly radioPriorityHigh:   Locator;
  readonly prioritySelection:   Locator;

  readonly selectTimezone:  Locator;
  readonly timezoneOutput:  Locator;
  readonly selectCurrency:  Locator;
  readonly currencyOutput:  Locator;

  readonly textareaBio:     Locator;
  readonly charCurrent:     Locator;
  readonly charsRemaining:  Locator;
  readonly charBar:         Locator;
  readonly charWarning:     Locator;

  readonly stepperDecrement: Locator;
  readonly stepperValue:     Locator;
  readonly stepperIncrement: Locator;

  readonly colorPicker: Locator;
  readonly colorHex:    Locator;

  readonly inputDate:      Locator;
  readonly inputTime:      Locator;
  readonly inputDatetime:  Locator;
  readonly datetimeOutput: Locator;

  readonly sortableList: Locator;

  constructor(page: Page) {
    super(page);
    this.sliderBrightness      = page.getByTestId('slider-brightness');
    this.sliderBrightnessValue = page.getByTestId('slider-brightness-value');
    this.sliderVolume          = page.getByTestId('slider-volume');
    this.sliderVolumeValue     = page.getByTestId('slider-volume-value');
    this.sliderOpacity         = page.getByTestId('slider-opacity');
    this.sliderOpacityValue    = page.getByTestId('slider-opacity-value');

    this.toggleNotifications = page.getByTestId('toggle-notifications');
    this.toggleAutosave      = page.getByTestId('toggle-autosave');
    this.toggleDarkmode      = page.getByTestId('toggle-darkmode');
    this.toggleMarketing     = page.getByTestId('toggle-marketing');

    this.checkboxSelectAll = page.getByTestId('checkbox-select-all');
    this.checkboxAnalytics = page.getByTestId('checkbox-analytics');
    this.checkboxExport    = page.getByTestId('checkbox-export');
    this.checkboxApi       = page.getByTestId('checkbox-api');
    this.checkbox2fa       = page.getByTestId('checkbox-2fa');
    this.checkboxCount     = page.getByTestId('checkbox-count');

    this.radioPlanFree       = page.getByTestId('radio-plan-free');
    this.radioPlanPro        = page.getByTestId('radio-plan-pro');
    this.radioPlanEnterprise = page.getByTestId('radio-plan-enterprise');
    this.planSelection       = page.getByTestId('plan-selection');
    this.radioPriorityLow    = page.getByTestId('radio-priority-low');
    this.radioPriorityMedium = page.getByTestId('radio-priority-medium');
    this.radioPriorityHigh   = page.getByTestId('radio-priority-high');
    this.prioritySelection   = page.getByTestId('priority-selection');

    this.selectTimezone = page.getByTestId('select-timezone');
    this.timezoneOutput = page.getByTestId('timezone-output');
    this.selectCurrency = page.getByTestId('select-currency');
    this.currencyOutput = page.getByTestId('currency-output');

    this.textareaBio    = page.getByTestId('textarea-bio');
    this.charCurrent    = page.getByTestId('char-current');
    this.charsRemaining = page.getByTestId('chars-remaining');
    this.charBar        = page.getByTestId('char-bar');
    this.charWarning    = page.getByTestId('char-warning');

    this.stepperDecrement = page.getByTestId('stepper-decrement');
    this.stepperValue     = page.getByTestId('stepper-value');
    this.stepperIncrement = page.getByTestId('stepper-increment');

    this.colorPicker = page.getByTestId('color-picker');
    this.colorHex    = page.getByTestId('color-hex');

    this.inputDate      = page.getByTestId('input-date');
    this.inputTime      = page.getByTestId('input-time');
    this.inputDatetime  = page.getByTestId('input-datetime');
    this.datetimeOutput = page.getByTestId('datetime-output');

    this.sortableList = page.getByTestId('sortable-list');
  }

  async goto(): Promise<void> {
    await this.page.goto('/controls');
  }

  sortableItems(): Locator {
    return this.sortableList.getByTestId('sortable-item');
  }

  async getSortableOrder(): Promise<string[]> {
    return test.step('Read sortable list order', async () => {
      return this.sortableItems().allTextContents().then(
        texts => texts.map(t => t.replace(/Priority \d+/, '').trim()),
      );
    });
  }

  async getSliderValue(testId: string): Promise<number> {
    const el = this.page.getByTestId(testId);
    return parseInt(await el.inputValue(), 10);
  }

  async setSliderValue(testId: string, value: number): Promise<void> {
    return test.step('Set slider value', async () => {
      await this.page.getByTestId(testId).fill(String(value));
      await this.page.getByTestId(testId).dispatchEvent('input');
    });
  }

  accordion(n: number): Locator {
    return this.page.getByTestId(`accordion-${n}`);
  }

  accordionTrigger(n: number): Locator {
    return this.page.getByTestId(`accordion-trigger-${n}`);
  }

  accordionContent(n: number): Locator {
    return this.page.getByTestId(`accordion-content-${n}`);
  }
}
