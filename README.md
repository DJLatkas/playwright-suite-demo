# Playwright + TypeScript Demo Suite

A production-grade Playwright test suite built against a co-located Express admin app. Demonstrates Page Object Models, custom fixtures, test tagging, `test.step()` reporting, accessibility scanning, and a three-tier CI/CD pipeline.

---

## Quick start

```bash
git clone https://github.com/DJLatkas/playwright-suite-demo.git
cd playwright-suite-demo
cp .env.example .env
npm install
npx playwright install --with-deps
npm test
```

The Express app starts automatically via `webServer` in `playwright.config.ts`. No separate server process needed.

---

## Running tests

```bash
# Full suite
npm test

# By tag
npx playwright test --grep @smoke          # ~30 seconds, fastest signal
npx playwright test --grep @critical       # core user-facing flows
npx playwright test --grep @regression     # full safety net
npx playwright test --grep @api            # API contract tests only
npx playwright test --grep @a11y           # accessibility scans

# By feature
npx playwright test --grep @dashboard
npx playwright test --grep @auth
npx playwright test --grep @filter
npx playwright test --grep @edit
npx playwright test --grep @toggle

# Single browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-chrome

# Headed (watch the browser)
npx playwright test --grep @smoke --project=chromium --headed

# Open last report
npm run test:report
```

---

## Test structure

```
tests/
├── e2e/
│   ├── login.spec.ts          # Auth flows, redirects, error states
│   ├── dashboard.spec.ts      # User table, add user, delete user, logout
│   ├── users.edit.spec.ts     # Edit modal, pre-fill, save, validation
│   ├── users.filter.spec.ts   # Search, role filter, empty state
│   ├── users.toggle.spec.ts   # Inline status toggle, optimistic update
│   ├── reports.spec.ts        # Summary stats, activity log, CSV export
│   └── controls.spec.ts       # Sliders, toggles, checkboxes, accordion, drag-to-sort
├── api/
│   └── users.spec.ts          # REST contract tests (health, auth, CRUD)
└── accessibility/
    └── login.a11y.spec.ts     # WCAG 2.1 AA scans (login + dashboard)
```

```
src/
├── fixtures/index.ts          # Custom fixtures: authedApi, authenticatedDashboard, etc.
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── ReportsPage.ts / ControlsPage.ts
├── api/endpoints/UsersApi.ts  # Typed API client
└── utils/
    ├── testData.ts            # Credentials, seeded users, uniqueEmail()
    └── accessibility.ts       # axe-core helpers
```

---

## Tag taxonomy

Every test has exactly one **tier** tag and one or more **feature** tags.

| Tag | Meaning |
|---|---|
| `@smoke` | Fastest signal the app is alive — auth redirects, page loads, initial state |
| `@critical` | Core flows whose failure blocks all other work — login, add user, save edit |
| `@regression` | Everything else; broad safety net |
| `@auth` | Login, logout, token handling, redirect-on-unauthenticated |
| `@dashboard` | `/dashboard` or the user table |
| `@reports` | `/reports` |
| `@controls` | `/controls` |
| `@api` | Direct API tests via `UsersApi` |
| `@a11y` | Accessibility scans |
| `@filter` | Search, filter, dropdown narrowing |
| `@edit` | Edit modal — open, pre-fill, save, validation |
| `@toggle` | Inline status toggle, optimistic update, revert |

---

## Page Object Models

POMs live in `src/pages/`. Multi-action methods are wrapped with `test.step()` so the HTML report shows a readable step tree rather than raw locator calls.

```typescript
// DashboardPage.ts
async addUser(name, email, role, status = 'Active') {
  return test.step('Add user via modal', async () => {
    await test.step('Fill name field', ...);
    await test.step('Fill email field', ...);
    await test.step('Select role', ...);
    ...
  });
}
```

In the HTML report this renders as a nested, human-readable trace — useful for sharing failure evidence with non-engineers.

---

## CI/CD pipeline

`.github/workflows/playwright.yml` runs three jobs:

| Job | Trigger | Scope | Browsers |
|---|---|---|---|
| **Smoke** | Every push | `@smoke` | Chromium only |
| **Critical** | Every PR | `@critical` | All 5 projects |
| **Regression** | PR → `main`, after Critical passes | `@regression` | All 5 projects |

The HTML report is uploaded as an artifact on every run (including failures). The `critical` job is the required status check that gates merges.

---

## Demo: break and fix

A pair of scripts introduce and revert a realistic regression for live demos.

```bash
# Introduce the bug
npm run demo:break

# Revert the fix
npm run demo:fix
```

**What breaks:** a toast message copy change in `app/public/js/main.js` — `'User added successfully'` becomes `'User created successfully'`. The data saves correctly and API tests stay green, but two `@critical` E2E tests that assert the toast wording fail:

```
✕  Dashboard — adds a new user and shows success toast
✕  Edit User — saving a valid edit updates the row in the table
```

The HTML report trace shows the toast element was found but contained the wrong text — diagnosable in under a minute without reading code.

**Demo arc:**
1. `npm run demo:break` → commit → push → smoke passes, looks fine
2. Open PR → critical job fails → PR blocked → open the report artifact
3. Walk the trace live, identify the copy mismatch
4. `npm run demo:fix` (or edit `main.js` directly) → push → critical goes green → regression runs → all green → PR unblocked
