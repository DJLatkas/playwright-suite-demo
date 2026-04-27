import { test, expect } from '../../src/fixtures';
import { uniqueEmail, SEEDED_USERS } from '../../src/utils/testData';

test.describe('Edit User', () => {
  test('edit icon is present on each row', { tag: ['@smoke', '@dashboard', '@edit'] }, async ({ authenticatedDashboard: _dash, page }) => {
    const editButtons = page.getByTestId('edit-button');
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('clicking edit icon opens modal pre-populated with correct values', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Create a user whose data we control so seeded-user mutations don't matter
    const name  = `EditOpen_${Date.now()}`;
    const email = uniqueEmail('editopen');
    await dash.addUser(name, email, 'Editor');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: name });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();
    await expect(dash.nameInput).toHaveValue(name);
  });

  test('modal pre-fills all fields with correct values', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `PreFill_${Date.now()}`;
    const email = uniqueEmail('prefill');
    await dash.addUser(name, email, 'Admin');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: name });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();
    await expect(dash.nameInput).toHaveValue(name);
    await expect(dash.emailInput).toHaveValue(email);
    await expect(dash.roleSelect).toHaveValue('Admin');
    await expect(dash.statusSelect).toHaveValue('Active');
  });

  test('clicking anywhere on a row also opens the edit modal', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `RowClick_${Date.now()}`;
    const email = uniqueEmail('rowclick');
    await dash.addUser(name, email, 'Viewer');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: name });
    await row.locator('td.td-name').click();
    await expect(dash.modal).toBeVisible();
    await expect(dash.nameInput).toHaveValue(name);
  });

  test('saving a valid edit updates the row in the table', { tag: ['@critical', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const email = uniqueEmail('edit-target');
    await dash.addUser('Edit Target', email, 'Viewer');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: 'Edit Target' });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();

    const newName = `Edited ${Date.now()}`;
    await dash.nameInput.fill(newName);
    await dash.saveButton.click({ force: true });
    await expect(dash.modal).toBeHidden();
    await dash.expectToast('User updated');

    const names = await dash.getUserNames();
    expect(names).toContain(newName);
  });

  test('PUT fires with the correct body on save', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const email = uniqueEmail('put-body');
    await dash.addUser('PUT Body Test', email, 'Editor');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: 'PUT Body Test' });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();

    const updatedName = `PUT Updated ${Date.now()}`;
    await dash.nameInput.fill(updatedName);

    const [response] = await Promise.all([
      page.waitForResponse(
        res => /\/api\/users\/\d+/.test(res.url()) && res.request().method() === 'PUT',
      ),
      dash.saveButton.click({ force: true }),
    ]);

    const body = await response.json() as { name: string };
    expect(body.name).toBe(updatedName);
  });

  test('validation blocks save when name is cleared', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `ValidateEdit_${Date.now()}`;
    const email = uniqueEmail('validateedit');
    await dash.addUser(name, email, 'Viewer');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: name });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();
    await dash.nameInput.fill('');
    await dash.saveButton.click({ force: true });
    await expect(dash.formError).toBeVisible();
    await expect(dash.modal).toBeVisible();
  });

  test('duplicate email on edit shows the conflict error', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Create two users so we can try to give user-1 the email of user-2
    const ts     = Date.now();
    const nameA  = `Dup User A ${ts}`;
    const nameB  = `Dup User B ${ts}`;
    const emailA = uniqueEmail('dup-a');
    const emailB = uniqueEmail('dup-b');
    await dash.addUser(nameA, emailA, 'Viewer');
    await dash.expectToast('User added');
    await dash.addUser(nameB, emailB, 'Editor');
    await dash.expectToast('User added');

    const row = page.getByTestId('user-row').filter({ hasText: nameA });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();
    // Try to assign emailB (already taken by Dup User B)
    await dash.emailInput.fill(emailB);
    await dash.saveButton.click({ force: true });
    await expect(dash.formError).toBeVisible();
    await expect(dash.formError).toContainText('already exists');
  });

  test('Escape key closes the modal', { tag: ['@regression', '@dashboard', '@edit'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Use a seeded user's email to find the row without caring about its name
    const row = page.getByTestId('user-row').filter({ hasText: SEEDED_USERS[0].email });
    await row.getByTestId('edit-button').click();
    await expect(dash.modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dash.modal).toBeHidden();
  });
});
