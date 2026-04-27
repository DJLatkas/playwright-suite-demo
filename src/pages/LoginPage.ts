import { Page, Locator, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput   = page.getByTestId('username-input');
    this.passwordInput   = page.getByTestId('password-input');
    this.submitButton    = page.getByTestId('login-button');
    this.errorMessage    = page.getByTestId('error-message');
    this.loadingSpinner  = page.getByTestId('loading-spinner');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    return test.step('Log in with credentials', async () => {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.submitButton.click();
    });
  }

  async expectError(message?: string): Promise<void> {
    return test.step('Assert login error message', async () => {
      await expect(this.errorMessage).toBeVisible();
      if (message) {
        await expect(this.errorMessage).toContainText(message);
      }
    });
  }

  async expectRedirectToDashboard(): Promise<void> {
    await this.page.waitForURL(/dashboard/);
  }
}
