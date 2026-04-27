import { Router, Request, Response, NextFunction } from 'express';

export const apiRouter = Router();

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
}

interface AuthBody {
  username?: string;
  password?: string;
}

interface CreateUserBody {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface ActivityEntry {
  id: number;
  action: 'add' | 'edit' | 'delete' | 'toggle';
  userName: string;
  timestamp: string;
}

// ── In-memory store ───────────────────────────────────────────────────────────

let nextId = 4;

const users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@acme.com', role: 'Admin',  status: 'Active'   },
  { id: 2, name: 'Bob Smith',     email: 'bob@acme.com',   role: 'Editor', status: 'Active'   },
  { id: 3, name: 'Carol White',   email: 'carol@acme.com', role: 'Viewer', status: 'Inactive' },
];

const sessions = new Map<string, string>(); // token → username

const CREDENTIALS = {
  username: process.env.APP_USERNAME ?? 'admin',
  password: process.env.APP_PASSWORD ?? 'password123',
};

// ── Activity log ──────────────────────────────────────────────────────────────

const activityLog: ActivityEntry[] = [];
let nextActivityId = 1;

function logActivity(action: ActivityEntry['action'], userName: string): void {
  activityLog.push({ id: nextActivityId++, action, userName, timestamp: new Date().toISOString() });
}

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ── Health ────────────────────────────────────────────────────────────────────

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body as AuthBody;
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    const token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    sessions.set(token, username);
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ message: 'Logged out' });
});

// ── Users CRUD ────────────────────────────────────────────────────────────────

apiRouter.get('/users', requireAuth, (_req: Request, res: Response) => {
  res.json({ users, total: users.length });
});

apiRouter.post('/users', requireAuth, (req: Request, res: Response) => {
  const { name, email, role, status } = req.body as CreateUserBody;

  if (!name?.trim() || !email?.trim() || !role?.trim()) {
    res.status(400).json({ error: 'name, email, and role are required' });
    return;
  }

  if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    res.status(409).json({ error: 'A user with that email already exists' });
    return;
  }

  const newUser: User = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    role: role as User['role'],
    status: (status as User['status']) ?? 'Active',
  };

  users.push(newUser);
  logActivity('add', newUser.name);
  res.status(201).json(newUser);
});

apiRouter.put('/users/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === id);

  if (idx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const body = req.body as Partial<User>;

  // Duplicate-email check (only when email changes)
  if (body.email && body.email.trim().toLowerCase() !== users[idx].email.toLowerCase()) {
    if (users.some((u, i) => i !== idx && u.email.toLowerCase() === body.email!.trim().toLowerCase())) {
      res.status(409).json({ error: 'A user with that email already exists' });
      return;
    }
  }

  const isToggle = Object.keys(body).length === 1 && 'status' in body;
  users[idx] = { ...users[idx], ...body, id };
  logActivity(isToggle ? 'toggle' : 'edit', users[idx].name);
  res.json(users[idx]);
});

apiRouter.delete('/users/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === id);

  if (idx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const deletedName = users[idx].name;
  users.splice(idx, 1);
  logActivity('delete', deletedName);
  res.json({ message: 'User deleted' });
});

// ── Reports ───────────────────────────────────────────────────────────────────

apiRouter.get('/reports/summary', requireAuth, (_req: Request, res: Response) => {
  const total = users.length;
  const active = users.filter(u => u.status === 'Active').length;
  const inactive = total - active;
  const byRole = {
    Admin:  users.filter(u => u.role === 'Admin').length,
    Editor: users.filter(u => u.role === 'Editor').length,
    Viewer: users.filter(u => u.role === 'Viewer').length,
  };
  res.json({ total, active, inactive, byRole });
});

apiRouter.get('/reports/activity', requireAuth, (_req: Request, res: Response) => {
  res.json([...activityLog].reverse());
});

apiRouter.get('/reports/export', requireAuth, (_req: Request, res: Response) => {
  const rows = [
    'id,name,email,role,status',
    ...users.map(u => `${u.id},"${u.name}","${u.email}","${u.role}","${u.status}"`),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  res.send(rows);
});
