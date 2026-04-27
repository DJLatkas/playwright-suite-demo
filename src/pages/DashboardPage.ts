import { Page, Locator, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly userTable:      Locator;
  readonly addUserButton:  Locator;
  readonly modal:          Locator;
  readonly nameInput:      Locator;
  readonly emailInput:     Locator;
  readonly roleSelect:     Locator;
  readonly statusSelect:   Locator;
  readonly saveButton:     Locator;
  readonly cancelButton:   Locator;
  readonly formError:      Locator;
  readonly logoutButton:   Locator;

  constructor(page: Page) {
    super(page);
    this.userTable     = page.getByTestId('user-table');
    this.addUserButton = page.getByTestId('add-user-button');
    this.modal         = page.getByTestId('user-modal');
    this.nameInput     = page.getByTestId('user-name-input');
    this.emailInput    = page.getByTestId('user-email-input');
    this.roleSelect    = page.getByTestId('user-role-select');
    this.statusSelect  = page.locator('#user-status');
    this.saveButton    = page.getByTestId('save-user-button');
    this.cancelButton  = page.getByTestId('cancel-button');
    this.formError     = page.getByTestId('form-error');
    this.logoutButton  = page.getByTestId('logout-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async getRowCount(): Promise<number> {
    return this.page.getByTestId('user-row').count();
  }

  async getUserNames(): Promise<string[]> {
    return this.page.getByTestId('user-row').locator('td:first-child').allTextContents();
  }

  async addUser(name: string, email: string, role: string, status = 'Active'): Promise<void> {
    return test.step('Add user via modal', async () => {
      await this.addUserButton.click();
      await expect(this.modal).toBeVisible();
      await test.step('Fill name field', async () => {
        await this.nameInput.fill(name);
      });
      await test.step('Fill email field', async () => {
        await this.emailInput.fill(email);
      });
      await test.step('Select role', async () => {
        await this.roleSelect.selectOption(role);
      });
      await test.step('Select status', async () => {
        await this.statusSelect.selectOption(status);
      });
      await this.saveButton.scrollIntoViewIfNeeded();
      await this.saveButton.click({ force: true });
      await expect(this.modal).toBeHidden();
    });
  }

  async deleteUser(name: string): Promise<void> {
    return test.step('Delete user by name', async () => {
      const row = this.page.getByTestId('user-row').filter({ hasText: name });
      await row.getByTestId('delete-button').click();
      await this.page.getByTestId('confirm-delete').click({ force: true });
      await expect(this.page.getByTestId('user-row').filter({ hasText: name })).toHaveCount(0);
    });
  }

  async expectToast(message?: string): Promise<void> {
    return test.step('Assert toast message', async () => {
      const toast = this.page.getByTestId('toast').last();
      await expect(toast).toBeVisible();
      if (message) await expect(toast).toContainText(message);
    });
  }

  async logout(): Promise<void> {
    return test.step('Log out', async () => {
      await this.logoutButton.click();
      await this.page.waitForURL(/login/);
    });
  }
}
