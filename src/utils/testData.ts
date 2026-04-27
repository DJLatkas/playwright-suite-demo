import type { UserRole, UserStatus } from '../api/endpoints/UsersApi';

export const TEST_CREDENTIALS = {
  username: process.env['APP_USERNAME'] ?? 'admin',
  password: process.env['APP_PASSWORD'] ?? 'password123',
} as const;

export const INVALID_CREDENTIALS = {
  username: 'notauser',
  password: 'wrongpassword',
} as const;

export const SEEDED_USERS = [
  { name: 'Alice Johnson', email: 'alice@acme.com', role: 'Admin'  as UserRole, status: 'Active'   as UserStatus },
  { name: 'Bob Smith',     email: 'bob@acme.com',   role: 'Editor' as UserRole, status: 'Active'   as UserStatus },
  { name: 'Carol White',   email: 'carol@acme.com', role: 'Viewer' as UserRole, status: 'Inactive' as UserStatus },
] as const;

export const NEW_USER = {
  name:   'Test User',
  email:  'testuser@example.com',
  role:   'Viewer' as UserRole,
  status: 'Active' as UserStatus,
} as const;

export const EDITOR_USER = {
  name:   'Editor Test',
  email:  'editortest@example.com',
  role:   'Editor' as UserRole,
  status: 'Active' as UserStatus,
} as const;

/** Returns a unique email to avoid cross-test collisions in the in-memory store */
export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}_${Date.now()}@test.com`;
}
