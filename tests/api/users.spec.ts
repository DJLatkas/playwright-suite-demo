import { test, expect } from '../../src/fixtures';
import { UsersApi } from '../../src/api/endpoints/UsersApi';
import { TEST_CREDENTIALS, INVALID_CREDENTIALS, uniqueEmail } from '../../src/utils/testData';

// ── Health ────────────────────────────────────────────────────────────────────

test.describe('GET /api/health', () => {
  test('returns 200 with status ok', { tag: ['@smoke', '@api'] }, async ({ usersApi }) => {
    const res = await usersApi.health();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

test.describe('POST /api/auth/login', () => {
  test('returns 200 and token on valid credentials', { tag: ['@critical', '@api', '@auth'] }, async ({ usersApi }) => {
    const res = await usersApi.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.username).toBe(TEST_CREDENTIALS.username);
  });

  test('returns 401 on wrong password', { tag: ['@regression', '@api', '@auth'] }, async ({ usersApi }) => {
    const res = await usersApi.login(TEST_CREDENTIALS.username, 'wrong');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  test('returns 401 on wrong username', { tag: ['@regression', '@api', '@auth'] }, async ({ usersApi }) => {
    const res = await usersApi.login(INVALID_CREDENTIALS.username, INVALID_CREDENTIALS.password);
    expect(res.status).toBe(401);
  });
});

test.describe('POST /api/auth/logout', () => {
  test('returns 200 and invalidates the token', { tag: ['@regression', '@api', '@auth'] }, async ({ request }) => {
    const api = new UsersApi(request);
    const login = await api.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    api.setToken(login.body.token);

    const logout = await api.logout();
    expect(logout.status).toBe(200);

    // Token should now be invalid
    const users = await api.getUsers();
    expect(users.status).toBe(401);
  });
});

// ── Users — auth guard ────────────────────────────────────────────────────────

test.describe('Users — auth guard', () => {
  test('GET /api/users without token returns 401', { tag: ['@regression', '@api', '@auth'] }, async ({ usersApi }) => {
    const res = await usersApi.getUsers();
    expect(res.status).toBe(401);
  });

  test('POST /api/users without token returns 401', { tag: ['@regression', '@api', '@auth'] }, async ({ usersApi }) => {
    const res = await usersApi.createUser({ name: 'X', email: 'x@x.com', role: 'Viewer', status: 'Active' });
    expect(res.status).toBe(401);
  });
});

// ── Users CRUD ────────────────────────────────────────────────────────────────

test.describe('GET /api/users', () => {
  test('returns array of users with total count', { tag: ['@smoke', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.getUsers();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.total).toBe(res.body.users.length);
    expect(res.body.total).toBeGreaterThan(0);
  });

  test('each user has required fields', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.getUsers();
    for (const user of res.body.users) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
    }
  });
});

test.describe('POST /api/users', () => {
  test('creates user and returns 201 with assigned id', { tag: ['@critical', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.createUser({
      name: 'API Test User',
      email: uniqueEmail('create'),
      role: 'Viewer',
      status: 'Active',
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe('API Test User');
  });

  test('returns 400 when name is missing', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.createUser({ name: '', email: uniqueEmail(), role: 'Viewer', status: 'Active' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  test('returns 400 when email is missing', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.createUser({ name: 'Test', email: '', role: 'Viewer', status: 'Active' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when role is missing', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.createUser({ name: 'Test', email: uniqueEmail(), role: '' as 'Viewer', status: 'Active' });
    expect(res.status).toBe(400);
  });

  test('created user is retrievable via GET /api/users', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const email = uniqueEmail('persist');
    const created = await authedApi.createUser({ name: 'Persist Check', email, role: 'Admin', status: 'Active' });
    expect(created.status).toBe(201);

    const list = await authedApi.getUsers();
    const found = list.body.users.find(u => u.id === created.body.id);
    expect(found).toBeDefined();
    expect(found?.email).toBe(email);
  });
});

test.describe('PUT /api/users/:id', () => {
  test('updates user name', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const list = await authedApi.getUsers();
    const target = list.body.users[0];
    const res = await authedApi.updateUser(target.id, { name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.id).toBe(target.id);
  });

  test('updates user status', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const list = await authedApi.getUsers();
    const target = list.body.users[0];
    const res = await authedApi.updateUser(target.id, { status: 'Inactive' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Inactive');
  });

  test('returns 404 for non-existent id', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.updateUser(999_999, { name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

test.describe('DELETE /api/users/:id', () => {
  test('deletes user and returns 200', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const created = await authedApi.createUser({
      name: 'To Delete',
      email: uniqueEmail('del'),
      role: 'Viewer',
      status: 'Active',
    });
    const res = await authedApi.deleteUser(created.body.id);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeTruthy();
  });

  test('deleted user is absent from subsequent GET', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const created = await authedApi.createUser({
      name: 'Gone',
      email: uniqueEmail('gone'),
      role: 'Viewer',
      status: 'Active',
    });
    await authedApi.deleteUser(created.body.id);
    const list = await authedApi.getUsers();
    expect(list.body.users.find(u => u.id === created.body.id)).toBeUndefined();
  });

  test('returns 404 for non-existent id', { tag: ['@regression', '@api'] }, async ({ authedApi }) => {
    const res = await authedApi.deleteUser(999_999);
    expect(res.status).toBe(404);
  });
});
