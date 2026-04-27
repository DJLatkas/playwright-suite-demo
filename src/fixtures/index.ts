import { test as base, request as baseRequest } from '@playwright/test';
import { LoginPage }    from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ReportsPage }  from '../pages/ReportsPage';
import { ControlsPage } from '../pages/ControlsPage';
import { UsersApi, User } from '../api/endpoints/UsersApi';
import { TEST_CREDENTIALS } from '../utils/testData';

type AppFixtures = {
  loginPage:              LoginPage;
  dashboardPage:          DashboardPage;
  reportsPage:            ReportsPage;
  controlsPage:           ControlsPage;
  usersApi:               UsersApi;
  authedApi:              UsersApi;
  authenticatedDashboard: DashboardPage;
  authenticatedReports:   ReportsPage;
  authenticatedControls:  ControlsPage;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  reportsPage: async ({ page }, use) => {
    await use(new ReportsPage(page));
  },

  controlsPage: async ({ page }, use) => {
    await use(new ControlsPage(page));
  },

  /** Unauthenticated API client — useful for auth contract tests */
  usersApi: async ({ request }, use) => {
    await use(new UsersApi(request));
  },

  /**
   * Pre-authenticated API client.
   * Wraps createUser() to track every user created during the test and
   * deletes them all in teardown, keeping the in-memory store clean.
   */
  authedApi: async ({ request }, use) => {
    const api = new UsersApi(request);
    const res = await api.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    api.setToken(res.body.token);

    const createdIds: number[] = [];
    const origCreate = api.createUser.bind(api);
    api.createUser = async (data: Omit<User, 'id'>) => {
      const result = await origCreate(data);
      if (typeof result.body?.id === 'number') createdIds.push(result.body.id);
      return result;
    };

    await use(api);

    for (const id of createdIds) {
      await api.deleteUser(id).catch(() => {/* already deleted or missing — ignore */});
    }
  },

  /**
   * Pre-authenticated browser session landing on /dashboard.
   * Intercepts POST /api/users responses to track created IDs and deletes
   * them in teardown so each test leaves the store at its starting state.
   */
  authenticatedDashboard: async ({ page }, use) => {
    const ctx  = await baseRequest.newContext();
    const api  = new UsersApi(ctx);
    const auth = await api.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    api.setToken(auth.body.token);

    await page.goto('/login');
    await page.evaluate(
      ({ token, username }: { token: string; username: string }) => {
        globalThis.localStorage.setItem('auth_token', token);
        globalThis.localStorage.setItem('auth_user', username);
      },
      { token: auth.body.token, username: auth.body.username },
    );

    // Intercept POST /api/users responses to capture created user IDs.
    const createdIds: number[] = [];
    page.on('response', async response => {
      if (/\/api\/users$/.test(response.url()) && response.request().method() === 'POST') {
        try {
          const body = await response.json() as { id?: number };
          if (typeof body?.id === 'number') createdIds.push(body.id);
        } catch { /* response body already consumed — skip */ }
      }
    });

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="user-row"]');

    await use(new DashboardPage(page));

    // Teardown: delete every user this test created.
    for (const id of createdIds) {
      await api.deleteUser(id).catch(() => {});
    }
    await ctx.dispose();
  },

  /**
   * Pre-authenticated browser session landing on /controls.
   */
  authenticatedControls: async ({ page }, use) => {
    const ctx  = await baseRequest.newContext();
    const api  = new UsersApi(ctx);
    const auth = await api.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    await ctx.dispose();

    await page.goto('/login');
    await page.evaluate(
      ({ token, username }: { token: string; username: string }) => {
        globalThis.localStorage.setItem('auth_token', token);
        globalThis.localStorage.setItem('auth_user', username);
      },
      { token: auth.body.token, username: auth.body.username },
    );

    await page.goto('/controls');
    await page.waitForSelector('[data-testid="section-sliders"]');

    await use(new ControlsPage(page));
  },

  /**
   * Pre-authenticated browser session landing on /reports.
   */
  authenticatedReports: async ({ page }, use) => {
    const ctx  = await baseRequest.newContext();
    const api  = new UsersApi(ctx);
    const auth = await api.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    await ctx.dispose();

    await page.goto('/login');
    await page.evaluate(
      ({ token, username }: { token: string; username: string }) => {
        globalThis.localStorage.setItem('auth_token', token);
        globalThis.localStorage.setItem('auth_user', username);
      },
      { token: auth.body.token, username: auth.body.username },
    );

    await page.goto('/reports');
    await page.waitForSelector('[data-testid="reports-stat-total"]');

    await use(new ReportsPage(page));
  },
});

export { expect } from '@playwright/test';
