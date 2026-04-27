import { test, expect } from '../../src/fixtures';
import { TEST_CREDENTIALS, INVALID_CREDENTIALS } from '../../src/utils/testData';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test.describe('Page structure', () => {
    test('renders all required form elements', { tag: ['@smoke', '@auth'] }, async ({ loginPage }) => {
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      await expect(loginPage.submitButton).toBeEnabled();
    });

    test('password field masks input', { tag: ['@regression', '@auth'] }, async ({ loginPage }) => {
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('error message is hidden on page load', { tag: ['@smoke', '@auth'] }, async ({ loginPage }) => {
      await expect(loginPage.errorMessage).toBeHidden();
    });
  });

  test.describe('Happy path', () => {
    test('redirects to dashboard on valid credentials', { tag: ['@critical', '@auth'] }, async ({ loginPage }) => {
      await loginPage.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
      await loginPage.expectRedirectToDashboard();
    });

    test('persists auth token in localStorage after login', { tag: ['@regression', '@auth'] }, async ({ loginPage, page }) => {
      await loginPage.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
      await loginPage.expectRedirectToDashboard();
      const token = await page.evaluate(() => globalThis.localStorage.getItem('auth_token'));
      expect(token).toBeTruthy();
    });
  });

  test.describe('Error handling', () => {
    test('shows error on invalid credentials', { tag: ['@regression', '@auth'] }, async ({ loginPage }) => {
      await loginPage.login(INVALID_CREDENTIALS.username, INVALID_CREDENTIALS.password);
      await loginPage.expectError('Invalid credentials');
    });

    test('disables submit button during request', { tag: ['@regression', '@auth'] }, async ({ loginPage, page }) => {
      await page.route('/api/auth/login', async route => {
        await new Promise(r => setTimeout(r, 400));
        await route.continue();
      });
      await loginPage.usernameInput.fill(TEST_CREDENTIALS.username);
      await loginPage.passwordInput.fill(TEST_CREDENTIALS.password);
      await loginPage.submitButton.click();
      await expect(loginPage.submitButton).toBeDisabled();
    });

    test('re-enables submit button after failed login', { tag: ['@regression', '@auth'] }, async ({ loginPage }) => {
      await loginPage.login(INVALID_CREDENTIALS.username, INVALID_CREDENTIALS.password);
      await loginPage.expectError();
      await expect(loginPage.submitButton).toBeEnabled();
    });

    test('focuses username field when submitting empty form', { tag: ['@regression', '@auth'] }, async ({ loginPage }) => {
      await loginPage.submitButton.click();
      await expect(loginPage.usernameInput).toBeFocused();
    });
  });

  test.describe('Auth state', () => {
    test('redirects authenticated users away from login page', { tag: ['@regression', '@auth'] }, async ({ loginPage, page }) => {
      // Use real login flow, then /login should immediately bounce to /dashboard.
      await loginPage.goto();
      await loginPage.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
      await loginPage.expectRedirectToDashboard();
      await page.goto('/login');
      await expect(page).toHaveURL(/dashboard/);
    });
  });
});
