import { test, expect } from '../../src/fixtures';
import { uniqueEmail } from '../../src/utils/testData';

test.describe('Dashboard — User Management', () => {
  test.describe('Initial state', () => {
    test('renders user table with seeded data', { tag: ['@smoke', '@dashboard'] }, async ({ authenticatedDashboard: dash }) => {
      await expect(dash.userTable).toBeVisible();
      const count = await dash.getRowCount();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('stat cards reflect loaded users', { tag: ['@smoke', '@dashboard'] }, async ({ authenticatedDashboard: _dash, page }) => {
      await expect(page.locator('#stat-total')).not.toHaveText('—');
      const total = await page.locator('#stat-total').textContent();
      expect(Number(total)).toBeGreaterThan(0);
    });

    test('redirects unauthenticated users to login', { tag: ['@smoke', '@auth', '@dashboard'] }, async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Add user', () => {
    test('opens modal on Add user click', { tag: ['@regression', '@dashboard', '@edit'] }, async ({ authenticatedDashboard: dash }) => {
      await dash.addUserButton.click();
      await expect(dash.modal).toBeVisible();
    });

    test('closes modal on Cancel', { tag: ['@regression', '@dashboard', '@edit'] }, async ({ authenticatedDashboard: dash }) => {
      await dash.addUserButton.click();
      await expect(dash.modal).toBeVisible();
      await dash.cancelButton.click({ force: true });
      await expect(dash.modal).toBeHidden();
    });

    test('adds a new user and shows success toast', { tag: ['@critical', '@dashboard'] }, async ({ authenticatedDashboard: dash }) => {
      const before = await dash.getRowCount();
      await dash.addUser('Jane Doe', uniqueEmail('jane'), 'Editor');
      await dash.expectToast('User added');
      expect(await dash.getRowCount()).toBe(before + 1);
    });

    test('new user appears in the table', { tag: ['@regression', '@dashboard'] }, async ({ authenticatedDashboard: dash }) => {
      const email = uniqueEmail('newuser');
      await dash.addUser('New User', email, 'Viewer');
      const names = await dash.getUserNames();
      expect(names).toContain('New User');
    });

    test('shows inline error when required fields are empty', { tag: ['@regression', '@dashboard', '@edit'] }, async ({ authenticatedDashboard: dash }) => {
      await dash.addUserButton.click();
      await dash.saveButton.click({ force: true });
      await expect(dash.formError).toBeVisible();
    });

    test('modal does not close on save with invalid data', { tag: ['@regression', '@dashboard', '@edit'] }, async ({ authenticatedDashboard: dash }) => {
      await dash.addUserButton.click();
      await dash.saveButton.click({ force: true });
      await expect(dash.modal).toBeVisible();
    });
  });

  test.describe('Delete user', () => {
    test('removes user and shows success toast', { tag: ['@critical', '@dashboard'] }, async ({ authenticatedDashboard: dash }) => {
      // Add a user specifically for deletion
      const name = 'Delete Target';
      await dash.addUser(name, uniqueEmail('delete'), 'Viewer');
      await dash.expectToast();

      const before = await dash.getRowCount();
      await dash.deleteUser(name);
      await dash.expectToast('User deleted');
      expect(await dash.getRowCount()).toBe(before - 1);
    });

    test('deleted user no longer appears in the table', { tag: ['@regression', '@dashboard'] }, async ({ authenticatedDashboard: dash }) => {
      const name = 'Gone User';
      await dash.addUser(name, uniqueEmail('gone'), 'Viewer');
      await dash.deleteUser(name);
      const names = await dash.getUserNames();
      expect(names).not.toContain(name);
    });
  });

  test.describe('Logout', () => {
    test('clears session and redirects to login', { tag: ['@regression', '@auth', '@dashboard'] }, async ({ authenticatedDashboard: dash, page }) => {
      await dash.logout();
      const token = await page.evaluate(() => globalThis.localStorage.getItem('auth_token'));
      expect(token).toBeNull();
    });
  });
});
