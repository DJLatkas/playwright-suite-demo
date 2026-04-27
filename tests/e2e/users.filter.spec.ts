import { test, expect } from '../../src/fixtures';
import { uniqueEmail } from '../../src/utils/testData';

test.describe('Search and Role Filter', () => {
  test('typing a name shows only matching rows', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Create a user with a guaranteed-unique name so filtering is deterministic
    const uniqueName = `NameFilter_${Date.now()}`;
    const email = uniqueEmail('namefilter');
    await dash.addUser(uniqueName, email, 'Viewer');
    await dash.expectToast('User added');

    await page.getByTestId('search-input').fill(uniqueName);
    const rows = page.getByTestId('user-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(uniqueName);
  });

  test('typing a partial email shows only matching rows', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Use a domain unique enough that only this user matches
    const domain = `uniquedomain${Date.now()}.com`;
    const email  = `filteruser@${domain}`;
    await dash.addUser('Email Filter User', email, 'Viewer');
    await dash.expectToast('User added');

    await page.getByTestId('search-input').fill(domain);
    const rows = page.getByTestId('user-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(email);
  });

  test('role filter shows only users with that role', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Create a known Admin user for deterministic role filtering
    const adminName  = `AdminRole_${Date.now()}`;
    const adminEmail = uniqueEmail('adminrole');
    await dash.addUser(adminName, adminEmail, 'Admin');
    await dash.expectToast('User added');

    await page.getByTestId('role-filter').selectOption('Admin');
    const rows = page.getByTestId('user-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Every visible row must show the Admin role badge
    for (let i = 0; i < count; i++) {
      const roleCell = rows.nth(i).locator('td').nth(2);
      await expect(roleCell).toContainText('Admin');
    }
  });

  test('combining search and role filter narrows results correctly', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Create a uniquely named Admin user to guarantee exactly 1 result
    const uniqueName  = `ComboAdmin_${Date.now()}`;
    const uniqueEmail2 = uniqueEmail('combo');
    await dash.addUser(uniqueName, uniqueEmail2, 'Admin');
    await dash.expectToast('User added');

    await page.getByTestId('search-input').fill(uniqueName);
    await page.getByTestId('role-filter').selectOption('Admin');
    const rows = page.getByTestId('user-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(uniqueName);
  });

  test('empty state appears when nothing matches', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: _dash,
    page,
  }) => {
    await page.getByTestId('search-input').fill('xyznotfoundzzz999');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText('No users match your search.');
  });

  test('clearing the search restores the full list', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: _dash,
    page,
  }) => {
    const initialCount = await page.getByTestId('user-row').count();
    await page.getByTestId('search-input').fill('xyznotfoundzzz999');
    await expect(page.getByTestId('user-row')).toHaveCount(0);
    await page.getByTestId('search-input').fill('');
    await expect(page.getByTestId('user-row')).toHaveCount(initialCount);
  });

  test('role filter is reflected immediately in the DOM', { tag: ['@regression', '@dashboard', '@filter'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    // Create a Viewer so we know exactly which rows should appear
    const viewerName  = `ViewerRole_${Date.now()}`;
    const viewerEmail = uniqueEmail('viewerrole');
    await dash.addUser(viewerName, viewerEmail, 'Viewer');
    await dash.expectToast('User added');

    // Also add an Admin to verify it disappears after Viewer filter
    const adminName  = `AdminRole2_${Date.now()}`;
    const adminEmail = uniqueEmail('adminrole2');
    await dash.addUser(adminName, adminEmail, 'Admin');
    await dash.expectToast('User added');

    await page.getByTestId('role-filter').selectOption('Viewer');

    // Viewer row should be visible
    await expect(page.getByTestId('user-row').filter({ hasText: viewerName })).toBeVisible();
    // Admin row should be hidden
    await expect(page.getByTestId('user-row').filter({ hasText: adminName })).toHaveCount(0);
  });
});
