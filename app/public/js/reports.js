/* ── Auth guard ──────────────────────────────────────────────────────────── */

const token = localStorage.getItem('auth_token');
const username = localStorage.getItem('auth_user') ?? 'admin';

if (!token) {
  window.location.replace('/login');
}

const nameEl = document.getElementById('user-name-display');
const avatarEl = document.getElementById('user-avatar');
if (nameEl) nameEl.textContent = username;
if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();

/* ── API helper ──────────────────────────────────────────────────────────── */

async function api(method, path) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.replace('/login');
    return null;
  }

  return { status: res.status, data: await res.json() };
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('data-testid', 'toast');
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${type === 'success' ? '✓' : '✕'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ── State ───────────────────────────────────────────────────────────────── */

let allActivity = [];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/* ── Summary ─────────────────────────────────────────────────────────────── */

async function loadSummary() {
  const result = await api('GET', '/api/reports/summary');
  if (!result) return;

  const data = result.status === 200
    ? result.data
    : { total: 0, active: 0, inactive: 0, byRole: { Admin: 0, Editor: 0, Viewer: 0 } };

  document.getElementById('reports-stat-total').textContent    = data.total    ?? 0;
  document.getElementById('reports-stat-active').textContent   = data.active   ?? 0;
  document.getElementById('reports-stat-inactive').textContent = data.inactive ?? 0;

  renderRoleBreakdown(
    data.byRole  ?? { Admin: 0, Editor: 0, Viewer: 0 },
    data.total   ?? 0,
  );
}

/* ── Role breakdown ──────────────────────────────────────────────────────── */

function renderRoleBreakdown(byRole, total) {
  const container = document.getElementById('role-breakdown');
  const roles = ['Admin', 'Editor', 'Viewer'];

  if (total === 0) {
    container.innerHTML = '<p style="color:var(--color-text-muted);font-size:13px;">No users to display.</p>';
    return;
  }

  container.innerHTML = roles.map(role => {
    const count = byRole[role] ?? 0;
    const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="role-bar-row">
        <div class="role-bar-label">${role}</div>
        <div class="role-bar-track">
          <div
            class="role-bar-fill role-bar-fill-${role}"
            data-testid="role-bar-${role}"
            style="width:${pct}%;"
            role="img"
            aria-label="${role}: ${count} user${count !== 1 ? 's' : ''} (${pct}%)"
          ></div>
        </div>
        <div class="role-bar-count">${count}</div>
      </div>
    `;
  }).join('');
}

/* ── Activity ────────────────────────────────────────────────────────────── */

async function loadActivity() {
  const result = await api('GET', '/api/reports/activity');
  if (!result) return;
  allActivity = Array.isArray(result.data) ? result.data : [];
  renderActivity();
}

function renderActivity() {
  const fromVal = document.getElementById('date-from').value;
  const toVal   = document.getElementById('date-to').value;

  const fromDate = fromVal ? new Date(fromVal)                   : null;
  const toDate   = toVal   ? new Date(toVal + 'T23:59:59.999Z') : null;

  const filtered = allActivity.filter(entry => {
    const ts = new Date(entry.timestamp);
    if (fromDate && ts < fromDate) return false;
    if (toDate   && ts > toDate)   return false;
    return true;
  });

  const container = document.getElementById('activity-log');

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-activity" data-testid="empty-activity">No activity entries found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(entry => `
    <div class="activity-entry" data-testid="activity-entry">
      <span class="activity-action activity-action-${escHtml(entry.action)}">${escHtml(entry.action)}</span>
      <span class="activity-user">${escHtml(entry.userName)}</span>
      <span class="activity-time">${relativeTime(entry.timestamp)}</span>
    </div>
  `).join('');
}

/* ── Date filter listeners ───────────────────────────────────────────────── */

document.getElementById('date-from').addEventListener('input', renderActivity);
document.getElementById('date-to').addEventListener('input', renderActivity);

/* ── Export CSV ──────────────────────────────────────────────────────────── */

document.getElementById('export-csv-button').addEventListener('click', async function () {
  const res = await fetch('/api/reports/export', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.replace('/login');
    return;
  }

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'users.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

/* ── Logout ──────────────────────────────────────────────────────────────── */

document.getElementById('logout-button').addEventListener('click', async function () {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  localStorage.clear();
  window.location.replace('/login');
});

/* ── Init ────────────────────────────────────────────────────────────────── */

loadSummary();
loadActivity();
