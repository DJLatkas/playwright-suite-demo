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

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
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

let users = [];
let pendingDeleteId = null;
let editingUserId = null;
let searchQuery = '';
let roleFilter = '';

/* ── HTML helpers ────────────────────────────────────────────────────────── */

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function roleBadge(role) {
  return `<span class="badge badge-role-${role}">${role}</span>`;
}

/* ── Render ──────────────────────────────────────────────────────────────── */

function renderTable() {
  // Stats always reflect all users
  const active = users.filter(u => u.status === 'Active').length;
  document.getElementById('stat-total').textContent = users.length;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-inactive').textContent = users.length - active;

  // Apply search + role filter
  const query = searchQuery.trim().toLowerCase();
  const filtered = users.filter(u => {
    const matchesSearch = !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const tbody = document.getElementById('user-tbody');

  if (!filtered.length) {
    const msg = (query || roleFilter) ? 'No users match your search.' : 'No users found.';
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state" data-testid="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <p>${msg}</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr data-testid="user-row" data-id="${u.id}" tabindex="0"
        onclick="openEditModal(${u.id})"
        onkeydown="if(event.key==='Enter')openEditModal(${u.id})"
        style="cursor:pointer">
      <td class="td-name">${escHtml(u.name)}</td>
      <td class="td-email">${escHtml(u.email)}</td>
      <td>${roleBadge(u.role)}</td>
      <td>
        <button
          class="badge badge-${u.status}"
          data-testid="status-badge"
          onclick="event.stopPropagation(); toggleStatus(${u.id}, '${u.status}')"
          aria-label="Status: ${u.status}. Click to toggle."
          style="cursor:pointer;border:none;font-family:inherit;font-size:inherit;font-weight:inherit;letter-spacing:inherit;padding:3px 10px;"
        >${escHtml(u.status)}</button>
      </td>
      <td>
        <div class="td-actions">
          <button
            class="btn-icon"
            aria-label="Edit ${escHtml(u.name)}"
            data-testid="edit-button"
            onclick="event.stopPropagation(); openEditModal(${u.id})"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            class="btn-icon danger"
            aria-label="Delete ${escHtml(u.name)}"
            data-testid="delete-button"
            onclick="event.stopPropagation(); confirmDelete(${u.id})"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── Load users ──────────────────────────────────────────────────────────── */

async function loadUsers() {
  const result = await api('GET', '/api/users');
  if (!result) return;
  users = result.data.users ?? [];
  renderTable();
}

/* ── Status toggle ───────────────────────────────────────────────────────── */

async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const user = users.find(u => u.id === id);
  if (!user) return;

  // Optimistic update
  user.status = newStatus;
  renderTable();

  const result = await api('PUT', `/api/users/${id}`, { status: newStatus });
  if (!result || result.status !== 200) {
    // Revert on failure
    user.status = currentStatus;
    renderTable();
    showToast((result && result.data && result.data.error) ? result.data.error : 'Failed to update status', 'error');
  }
}

/* ── Search / filter ─────────────────────────────────────────────────────── */

document.getElementById('search-input').addEventListener('input', function () {
  searchQuery = this.value;
  renderTable();
});

document.getElementById('role-filter').addEventListener('change', function () {
  roleFilter = this.value;
  renderTable();
});

/* ── Modal ───────────────────────────────────────────────────────────────── */

const modalBackdrop = document.getElementById('user-modal-backdrop');
const userForm      = document.getElementById('user-form');
const formError     = document.getElementById('form-error');
const formErrorText = document.getElementById('form-error-text');
const modalTitle    = document.getElementById('modal-title');

function openAddModal() {
  editingUserId = null;
  modalBackdrop.dataset.mode = 'add';
  modalTitle.textContent = 'Add user';
  userForm.reset();
  formError.classList.add('hidden');
  modalBackdrop.classList.remove('hidden');
  document.getElementById('user-name').focus();
}

function openEditModal(id) {
  const user = users.find(u => u.id === id);
  if (!user) return;

  editingUserId = id;
  modalBackdrop.dataset.mode = 'edit';
  modalTitle.textContent = 'Edit user';
  formError.classList.add('hidden');

  document.getElementById('user-name').value = user.name;
  document.getElementById('user-email').value = user.email;
  document.getElementById('user-role').value = user.role;
  document.getElementById('user-status').value = user.status;

  modalBackdrop.classList.remove('hidden');
  document.getElementById('user-name').focus();
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  editingUserId = null;
}

document.getElementById('add-user-button').addEventListener('click', openAddModal);
document.getElementById('modal-close-btn').addEventListener('click', closeModal);
document.getElementById('cancel-button').addEventListener('click', closeModal);

modalBackdrop.addEventListener('click', function (e) {
  if (e.target === modalBackdrop) closeModal();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) {
    closeModal();
  }
});

document.getElementById('save-user-button').addEventListener('click', async function () {
  formError.classList.add('hidden');

  const name   = document.getElementById('user-name').value.trim();
  const email  = document.getElementById('user-email').value.trim();
  const role   = document.getElementById('user-role').value;
  const status = document.getElementById('user-status').value;

  if (!name || !email || !role) {
    formErrorText.textContent = 'Name, email, and role are required.';
    formError.classList.remove('hidden');
    return;
  }

  const isEdit = modalBackdrop.dataset.mode === 'edit';

  if (isEdit && editingUserId !== null) {
    const result = await api('PUT', `/api/users/${editingUserId}`, { name, email, role, status });
    if (!result) return;

    if (result.status === 200) {
      const idx = users.findIndex(u => u.id === editingUserId);
      if (idx !== -1) users[idx] = result.data;
      renderTable();
      closeModal();
      showToast('User updated');
    } else {
      formErrorText.textContent = result.data.error ?? 'Failed to update user.';
      formError.classList.remove('hidden');
    }
  } else {
    const result = await api('POST', '/api/users', { name, email, role, status });
    if (!result) return;

    if (result.status === 201) {
      users.push(result.data);
      renderTable();
      closeModal();
      showToast('User added successfully');
    } else {
      formErrorText.textContent = result.data.error ?? 'Failed to create user.';
      formError.classList.remove('hidden');
    }
  }
});

/* ── Delete ──────────────────────────────────────────────────────────────── */

const confirmBackdrop = document.getElementById('confirm-backdrop');

function confirmDelete(id) {
  pendingDeleteId = id;
  confirmBackdrop.classList.remove('hidden');
  document.getElementById('confirm-delete').focus();
}

document.getElementById('confirm-cancel').addEventListener('click', function () {
  pendingDeleteId = null;
  confirmBackdrop.classList.add('hidden');
});

document.getElementById('confirm-delete').addEventListener('click', async function () {
  if (pendingDeleteId === null) return;
  confirmBackdrop.classList.add('hidden');

  const result = await api('DELETE', `/api/users/${pendingDeleteId}`);
  if (!result) return;

  if (result.status === 200) {
    users = users.filter(u => u.id !== pendingDeleteId);
    pendingDeleteId = null;
    renderTable();
    showToast('User deleted');
  } else {
    showToast(result.data.error ?? 'Delete failed', 'error');
  }
});

/* ── Logout ──────────────────────────────────────────────────────────────── */

document.getElementById('logout-button').addEventListener('click', async function () {
  await api('POST', '/api/auth/logout');
  localStorage.clear();
  window.location.replace('/login');
});

/* ── Init ────────────────────────────────────────────────────────────────── */

loadUsers();
