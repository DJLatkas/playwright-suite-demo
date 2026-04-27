'use strict';

/* ── Auth guard ─────────────────────────────────────────────────────────── */
const token    = localStorage.getItem('auth_token');
const username = localStorage.getItem('auth_user') ?? 'admin';
if (!token) { window.location.replace('/login'); }

/* ── Username display ───────────────────────────────────────────────────── */
document.getElementById('user-name-display').textContent = username;
document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();

/* ── Logout ─────────────────────────────────────────────────────────────── */
document.getElementById('logout-button').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.replace('/login');
  }
});

/* ── Range sliders ──────────────────────────────────────────────────────── */
[
  ['slider-brightness', 'slider-brightness-value'],
  ['slider-volume',     'slider-volume-value'],
  ['slider-opacity',    'slider-opacity-value'],
].forEach(([sliderId, valueId]) => {
  const slider = document.querySelector(`[data-testid="${sliderId}"]`);
  const output = document.querySelector(`[data-testid="${valueId}"]`);
  slider.addEventListener('input', () => { output.textContent = slider.value; });
});

/* ── Toggle switches ────────────────────────────────────────────────────── */
document.querySelectorAll('.toggle-switch').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', String(next));
  });
});

/* ── Checkboxes ─────────────────────────────────────────────────────────── */
const selectAll      = document.getElementById('checkbox-select-all');
const featureBoxes   = Array.from(document.querySelectorAll('.feature-checkbox'));
const checkboxCount  = document.querySelector('[data-testid="checkbox-count"]');

function updateSelectAllState() {
  const checked = featureBoxes.filter(cb => cb.checked).length;
  checkboxCount.textContent = checked;
  selectAll.checked = checked === featureBoxes.length;
  selectAll.indeterminate = checked > 0 && checked < featureBoxes.length;
}

selectAll.addEventListener('change', () => {
  featureBoxes.forEach(cb => { cb.checked = selectAll.checked; });
  updateSelectAllState();
});

featureBoxes.forEach(cb => {
  cb.addEventListener('change', updateSelectAllState);
});

updateSelectAllState();

/* ── Radio buttons ──────────────────────────────────────────────────────── */
function bindRadioGroup(name, outputTestId, labelMap) {
  const output = document.querySelector(`[data-testid="${outputTestId}"]`);
  document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        output.textContent = labelMap[radio.value] ?? radio.value;
      }
    });
  });
  // Set initial display
  const initial = document.querySelector(`input[name="${name}"]:checked`);
  if (initial) output.textContent = labelMap[initial.value] ?? initial.value;
}

bindRadioGroup('plan', 'plan-selection', {
  free:       'Free',
  pro:        'Pro',
  enterprise: 'Enterprise',
});

bindRadioGroup('priority', 'priority-selection', {
  low:      'Low',
  medium:   'Medium',
  high:     'High',
  critical: 'Critical',
});

/* ── Select dropdowns ───────────────────────────────────────────────────── */
function bindSelect(testId, outputTestId) {
  const sel    = document.querySelector(`[data-testid="${testId}"]`);
  const output = document.querySelector(`[data-testid="${outputTestId}"]`);
  sel.addEventListener('change', () => {
    output.textContent = sel.options[sel.selectedIndex].text;
  });
  output.textContent = sel.options[sel.selectedIndex].text;
}

bindSelect('select-timezone', 'timezone-output');
bindSelect('select-currency', 'currency-output');

/* ── Textarea character counter ─────────────────────────────────────────── */
const textarea      = document.querySelector('[data-testid="textarea-bio"]');
const charCurrent   = document.querySelector('[data-testid="char-current"]');
const charsRemaining = document.querySelector('[data-testid="chars-remaining"]');
const charBar       = document.querySelector('[data-testid="char-bar"]');
const charWarning   = document.querySelector('[data-testid="char-warning"]');
const CHAR_LIMIT    = 200;
const WARN_THRESHOLD = 0.8;

textarea.addEventListener('input', () => {
  const len  = textarea.value.length;
  const pct  = len / CHAR_LIMIT;
  charCurrent.textContent    = len;
  charsRemaining.textContent = `${CHAR_LIMIT - len} left`;
  charBar.style.width        = `${pct * 100}%`;
  charBar.style.background   = pct >= 1 ? '#ef4444' : pct >= WARN_THRESHOLD ? '#f59e0b' : 'var(--color-primary)';
  charWarning.textContent    = pct >= WARN_THRESHOLD && pct < 1
    ? `⚠ ${CHAR_LIMIT - len} characters remaining`
    : pct >= 1 ? '✕ Character limit reached' : '';
});

/* ── Number stepper ─────────────────────────────────────────────────────── */
const stepperDisplay = document.querySelector('[data-testid="stepper-value"]');
const stepperDec     = document.querySelector('[data-testid="stepper-decrement"]');
const stepperInc     = document.querySelector('[data-testid="stepper-increment"]');
const STEPPER_MIN    = 1;
const STEPPER_MAX    = 99;
var stepperVal       = 1; // var so page.evaluate can set window.stepperVal in tests

function renderStepper() {
  stepperDisplay.textContent = stepperVal;
  stepperDec.disabled = stepperVal <= STEPPER_MIN;
  stepperInc.disabled = stepperVal >= STEPPER_MAX;
}

stepperDec.addEventListener('click', () => {
  if (stepperVal > STEPPER_MIN) { stepperVal--; renderStepper(); }
});
stepperInc.addEventListener('click', () => {
  if (stepperVal < STEPPER_MAX) { stepperVal++; renderStepper(); }
});

renderStepper();

/* ── Color picker ───────────────────────────────────────────────────────── */
const colorPicker = document.querySelector('[data-testid="color-picker"]');
const colorHex    = document.querySelector('[data-testid="color-hex"]');
colorPicker.addEventListener('input', () => {
  colorHex.textContent = colorPicker.value;
});

/* ── File input ─────────────────────────────────────────────────────────── */
document.getElementById('file-input').addEventListener('change', e => {
  const name = e.target.files[0]?.name ?? 'No file chosen';
  document.querySelector('[data-testid="file-name"]').textContent = name;
});

/* ── Date / Time output ─────────────────────────────────────────────────── */
const dateInput     = document.querySelector('[data-testid="input-date"]');
const timeInput     = document.querySelector('[data-testid="input-time"]');
const datetimeInput = document.querySelector('[data-testid="input-datetime"]');
const datetimeOut   = document.querySelector('[data-testid="datetime-output"]');

function updateDateOutput() {
  const parts = [];
  if (dateInput.value)     parts.push(`Date: <strong>${dateInput.value}</strong>`);
  if (timeInput.value)     parts.push(`Time: <strong>${timeInput.value}</strong>`);
  if (datetimeInput.value) parts.push(`DateTime: <strong>${datetimeInput.value}</strong>`);
  datetimeOut.innerHTML = parts.join(' &nbsp;·&nbsp; ');
}

[dateInput, timeInput, datetimeInput].forEach(el => {
  el.addEventListener('change', updateDateOutput);
});

/* ── Accordion – exclusive open ─────────────────────────────────────────── */
const accordionItems = Array.from(document.querySelectorAll('.accordion-item'));
accordionItems.forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      accordionItems.forEach(other => {
        if (other !== item) other.open = false;
      });
    }
  });
});

/* ── Drag to sort ───────────────────────────────────────────────────────── */
let dragSrc = null;

function getDragItems() {
  return Array.from(document.querySelectorAll('[data-testid="sortable-list"] [data-testid="sortable-item"]'));
}

function attachDragListeners() {
  getDragItems().forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover',  handleDragOver);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop',      handleDrop);
    item.addEventListener('dragend',   handleDragEnd);
  });
}

function handleDragStart(e) {
  dragSrc = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== dragSrc) this.classList.add('drag-over');
}

function handleDragLeave() {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  if (this === dragSrc) return;

  const list = this.parentNode;
  const items = getDragItems();
  const srcIdx  = items.indexOf(dragSrc);
  const destIdx = items.indexOf(this);

  if (srcIdx < destIdx) {
    list.insertBefore(dragSrc, this.nextSibling);
  } else {
    list.insertBefore(dragSrc, this);
  }

  updateBadges();
  attachDragListeners();
}

function handleDragEnd() {
  this.classList.remove('dragging');
  getDragItems().forEach(i => i.classList.remove('drag-over'));
  dragSrc = null;
}

function updateBadges() {
  getDragItems().forEach((item, idx) => {
    const badge = item.querySelector('.sortable-badge');
    if (badge) badge.textContent = `Priority ${idx + 1}`;
  });
}

attachDragListeners();
