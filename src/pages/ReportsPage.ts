import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportsPage extends BasePage {
  readonly summaryTotal:    Locator;
  readonly summaryActive:   Locator;
  readonly summaryInactive: Locator;
  readonly activityLog:     Locator;
  readonly dateFrom:        Locator;
  readonly dateTo:          Locator;
  readonly exportButton:    Locator;

  constructor(page: Page) {
    super(page);
    this.summaryTotal    = page.getByTestId('reports-stat-total');
    this.summaryActive   = page.getByTestId('reports-stat-active');
    this.summaryInactive = page.getByTestId('reports-stat-inactive');
    this.activityLog     = page.getByTestId('activity-log');
    this.dateFrom        = page.getByTestId('date-from');
    this.dateTo          = page.getByTestId('date-to');
    this.exportButton    = page.getByTestId('export-csv-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/reports');
  }

  async getSummaryTotal(): Promise<number> {
    return test.step('Read summary stat', async () => {
      return parseInt((await this.summaryTotal.textContent()) ?? '0', 10);
    });
  }

  async getSummaryActive(): Promise<number> {
    return test.step('Read summary stat', async () => {
      return parseInt((await this.summaryActive.textContent()) ?? '0', 10);
    });
  }

  async getActivityEntries(): Promise<Locator> {
    return this.page.getByTestId('activity-entry');
  }

  async getRoleBarPct(role: string): Promise<number> {
    return test.step('Read role bar percentage', async () => {
      const bar = this.page.getByTestId(`role-bar-${role}`);
      const style = await bar.getAttribute('style') ?? '';
      const m = style.match(/width:\s*([0-9.]+)%/);
      return m ? parseFloat(m[1]) : 0;
    });
  }
}
