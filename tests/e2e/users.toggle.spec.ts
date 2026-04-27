import { test, expect } from '../../src/fixtures';
import { uniqueEmail } from '../../src/utils/testData';

test.describe('Inline Status Toggle', () => {
  test('clicking Active badge changes it to Inactive and decrements stat card', { tag: ['@regression', '@dashboard', '@toggle'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `Toggle Active ${Date.now()}`;
    const email = uniqueEmail('toggle-active');
    await dash.addUser(name, email, 'Viewer', 'Active');
    await dash.expectToast('User added');

    const row    = page.getByTestId('user-row').filter({ hasText: name });
    const badge  = row.getByTestId('status-badge');
    const before = parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10);

    await expect(badge).toContainText('Active');
    await badge.click();
    await expect(badge).toContainText('Inactive');

    const after = parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10);
    expect(after).toBe(before - 1);
  });

  test('clicking Inactive badge changes it to Active and increments stat card', { tag: ['@regression', '@dashboard', '@toggle'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `Toggle Inactive ${Date.now()}`;
    const email = uniqueEmail('toggle-inactive');
    await dash.addUser(name, email, 'Viewer', 'Inactive');
    await dash.expectToast('User added');

    const row    = page.getByTestId('user-row').filter({ hasText: name });
    const badge  = row.getByTestId('status-badge');
    const before = parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10);

    await expect(badge).toContainText('Inactive');
    await badge.click();
    await expect(badge).toContainText('Active');

    const after = parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10);
    expect(after).toBe(before + 1);
  });

  test('PUT sends the correct status payload', { tag: ['@regression', '@dashboard', '@toggle'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `Toggle Payload ${Date.now()}`;
    const email = uniqueEmail('toggle-payload');
    await dash.addUser(name, email, 'Editor', 'Active');
    await dash.expectToast('User added');

    const row   = page.getByTestId('user-row').filter({ hasText: name });
    const badge = row.getByTestId('status-badge');

    const [response] = await Promise.all([
      page.waitForResponse(
        res => /\/api\/users\/\d+/.test(res.url()) && res.request().method() === 'PUT',
      ),
      badge.click(),
    ]);

    const body = await response.json() as { status: string };
    expect(body.status).toBe('Inactive');
  });

  test('failed PUT reverts the badge and shows an error toast', { tag: ['@regression', '@dashboard', '@toggle'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `Toggle Revert ${Date.now()}`;
    const email = uniqueEmail('toggle-revert');
    await dash.addUser(name, email, 'Viewer', 'Active');
    await dash.expectToast('User added');

    const row   = page.getByTestId('user-row').filter({ hasText: name });
    const badge = row.getByTestId('status-badge');

    await page.route(/\/api\/users\/\d+/, async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
      } else {
        await route.continue();
      }
    });

    await badge.click();

    await expect(badge).toContainText('Active');
    await dash.expectToast('Server error');

    await page.unroute(/\/api\/users\/\d+/);
  });

  test('stat cards stay accurate after multiple toggles', { tag: ['@regression', '@dashboard', '@toggle'] }, async ({
    authenticatedDashboard: dash,
    page,
  }) => {
    const name  = `Toggle Multi ${Date.now()}`;
    const email = uniqueEmail('toggle-multi');
    await dash.addUser(name, email, 'Viewer', 'Active');
    await dash.expectToast('User added');

    const row   = page.getByTestId('user-row').filter({ hasText: name });
    const badge = row.getByTestId('status-badge');

    const initial = parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10);

    await badge.click();
    await expect(badge).toContainText('Inactive');
    expect(parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10)).toBe(initial - 1);

    await badge.click();
    await expect(badge).toContainText('Active');
    expect(parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10)).toBe(initial);

    await badge.click();
    await expect(badge).toContainText('Inactive');
    expect(parseInt((await page.getByTestId('stat-active').textContent()) ?? '0', 10)).toBe(initial - 1);
  });
});
