/* === LAKSH LEARNS ADMIN ===
   Client-side admin panel. Edits are kept in localStorage as a draft and can be
   exported as data/courses.json to commit to the repo. No backend required. */

const STORAGE_KEY = 'll-admin-draft';
const THEME_KEY = 'll-theme';
const DATA_URL = 'data/courses.json';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const PRICINGS = ['free', 'paid'];

const state = {
  data: null,
  selectedId: null,
  isDraft: false,
  modalProviderId: null,
  editingCourseIndex: -1
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* --- utils --- */
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function slugify(str = '') {
  return String(str).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueId(base) {
  let id = base || 'provider';
  let n = 1;
  while (state.data.providers.some(p => p.id === id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

let toastTimer;
function toast(msg, icon = '✅') {
  const el = $('#toast');
  if (!el) return;
  el.innerHTML = `<span class="toast-icon">${icon}</span> ${escapeHtml(msg)}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* --- stats --- */
function recomputeStats(data) {
  const providers = data.providers || [];
  let totalCourses = 0, totalCertifications = 0, totalFree = 0, totalPaid = 0;
  providers.forEach(p => (p.courses || []).forEach(c => {
    totalCourses++;
    if (c.certification) totalCertifications++;
    if (c.pricing === 'free') totalFree++;
    else if (c.pricing === 'paid') totalPaid++;
  }));
  data.stats = {
    totalProviders: providers.length,
    totalCourses,
    totalCertifications,
    totalFree,
    totalPaid
  };
}

/* --- persistence --- */
let saveTimer;
function markDirty() {
  state.isDraft = true;
  recomputeStats(state.data);
  showDraftBanner(true);
  renderStats();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); } catch (e) {
      toast('Could not save draft (storage full?)', '⚠️');
    }
  }, 300);
}

function showDraftBanner(show) {
  const banner = $('#draft-banner');
  if (banner) banner.hidden = !show;
}

async function fetchServerData() {
  const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function isValidData(data) {
  return data && Array.isArray(data.providers);
}

/* --- rendering --- */
function renderStats() {
  const s = state.data.stats || {};
  const items = [
    { icon: '🏢', label: 'Providers', value: s.totalProviders ?? 0 },
    { icon: '📚', label: 'Courses', value: s.totalCourses ?? 0 },
    { icon: '🎓', label: 'Certifications', value: s.totalCertifications ?? 0 },
    { icon: '✅', label: 'Free', value: s.totalFree ?? 0 },
    { icon: '💰', label: 'Paid', value: s.totalPaid ?? 0 }
  ];
  $('#admin-stats').innerHTML = items.map(i => `
    <div class="admin-stat">
      <span class="admin-stat-icon">${i.icon}</span>
      <div>
        <div class="admin-stat-value">${i.value}</div>
        <div class="admin-stat-label">${escapeHtml(i.label)}</div>
      </div>
    </div>`).join('');
}

function renderProviderList() {
  const list = $('#provider-list');
  const query = ($('#provider-search').value || '').toLowerCase();
  const providers = state.data.providers.filter(p =>
    p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
  );
  if (!providers.length) {
    list.innerHTML = '<div class="empty">No providers</div>';
    return;
  }
  list.innerHTML = providers.map(p => `
    <button class="provider-item ${p.id === state.selectedId ? 'active' : ''}" data-id="${escapeHtml(p.id)}">
      <span class="provider-dot" style="background:${escapeHtml(p.color || '#00E5FF')}"></span>
      <span class="provider-item-name">${escapeHtml(p.name)}</span>
      <span class="provider-item-count">${(p.courses || []).length}</span>
    </button>`).join('');

  $$('.provider-item', list).forEach(btn => btn.addEventListener('click', () => {
    state.selectedId = btn.dataset.id;
    renderProviderList();
    renderContent();
  }));
}

function updateProviderListItem(p) {
  const item = $(`.provider-item[data-id="${CSS.escape(p.id)}"]`);
  if (!item) return;
  const nameEl = $('.provider-item-name', item);
  const dotEl = $('.provider-dot', item);
  if (nameEl) nameEl.textContent = p.name;
  if (dotEl) dotEl.style.background = p.color || '#00E5FF';
}

function getSelectedProvider() {
  return state.data.providers.find(p => p.id === state.selectedId) || null;
}

function currentCategories() {
  const set = new Set();
  state.data.providers.forEach(p => (p.courses || []).forEach(c => {
    if (c.category) set.add(c.category);
  }));
  return [...set].sort();
}

function courseRow(c, i, total) {
  return `<tr>
    <td class="muted">${i + 1}</td>
    <td class="title-cell">${escapeHtml(c.title)}</td>
    <td>${escapeHtml(c.difficulty || '')}</td>
    <td>${escapeHtml(c.category || '')}</td>
    <td>${escapeHtml(c.duration || '')}</td>
    <td><span class="badge ${c.pricing === 'free' ? 'badge-free' : 'badge-paid'}">${c.pricing === 'free' ? 'Free' : 'Paid'}</span></td>
    <td>${c.certification ? '🎓' : '—'}</td>
    <td>
      <div class="row-actions">
        <button class="icon-btn" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
        <button class="icon-btn" data-action="down" data-index="${i}" ${i === total - 1 ? 'disabled' : ''} title="Move down">↓</button>
        <button class="icon-btn" data-action="edit" data-index="${i}">Edit</button>
        <button class="icon-btn danger" data-action="delete" data-index="${i}">Delete</button>
      </div>
    </td>
  </tr>`;
}

function renderContent() {
  const container = $('#admin-content');
  const p = getSelectedProvider();
  if (!p) {
    container.innerHTML = '<div class="panel"><div class="empty-state">Select or add a provider to begin.</div></div>';
    return;
  }
  if (!Array.isArray(p.courses)) p.courses = [];

  container.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <h2>Provider Details</h2>
        <div class="panel-actions">
          <button class="admin-btn small" id="btn-provider-page">Download page HTML</button>
          <button class="admin-btn small danger" id="btn-delete-provider">Delete Provider</button>
        </div>
      </div>
      <div class="form-grid">
        <label>Name<input class="admin-input" data-field="name" value="${escapeHtml(p.name)}"></label>
        <label>ID (slug)<input class="admin-input" data-field="id" value="${escapeHtml(p.id)}"></label>
        <label class="span-2">Description<textarea class="admin-input" data-field="description" rows="2">${escapeHtml(p.description || '')}</textarea></label>
        <label>Color<input type="color" class="admin-input color-input" data-field="color" value="${/^#([0-9a-f]{6})$/i.test(p.color) ? p.color : '#00E5FF'}"></label>
        <label>Logo text<input class="admin-input" data-field="logo" value="${escapeHtml(p.logo || '')}"></label>
        <label>Logo image path<input class="admin-input" data-field="logoImage" value="${escapeHtml(p.logoImage || '')}" placeholder="assets/logos/xyz.svg"></label>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h2>Courses <span class="count-badge">${p.courses.length}</span></h2>
        <button class="admin-btn primary small" id="btn-add-course">+ Add Course</button>
      </div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>#</th><th>Title</th><th>Difficulty</th><th>Category</th><th>Duration</th><th>Pricing</th><th>Cert</th><th></th></tr>
          </thead>
          <tbody>
            ${p.courses.length
              ? p.courses.map((c, i) => courseRow(c, i, p.courses.length)).join('')
              : '<tr><td colspan="8" class="empty">No courses yet. Click “Add Course”.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;

  bindProviderFields(p);
  bindCourseTable(p);
}

/* --- provider events --- */
function bindProviderFields(p) {
  $$('#admin-content [data-field]').forEach(input => {
    const field = input.dataset.field;
    if (field === 'id') {
      input.addEventListener('change', () => handleIdChange(p, input.value));
      return;
    }
    input.addEventListener('input', () => {
      p[field] = input.value;
      markDirty();
      updateProviderListItem(p);
    });
  });

  const pageBtn = $('#btn-provider-page');
  if (pageBtn) pageBtn.addEventListener('click', () => downloadProviderPage(p));

  const delBtn = $('#btn-delete-provider');
  if (delBtn) delBtn.addEventListener('click', () => deleteProvider(p));
}

function handleIdChange(p, raw) {
  const oldId = p.id;
  const newId = slugify(raw);
  const input = $('#admin-content [data-field="id"]');
  if (!newId) {
    if (input) input.value = oldId;
    return;
  }
  if (newId === oldId) {
    if (input) input.value = newId;
    return;
  }
  if (state.data.providers.some(x => x !== p && x.id === newId)) {
    toast('Provider ID already exists', '❌');
    if (input) input.value = oldId;
    return;
  }
  p.id = newId;
  state.selectedId = newId;
  markDirty();
  renderProviderList();
  if (input) input.value = newId;
  toast(`Renamed to "${newId}"`, '✏️');
}

function bindCourseTable(p) {
  const tbody = $('#admin-content tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const i = Number(btn.dataset.index);
      const action = btn.dataset.action;
      if (action === 'edit') openCourseModal(p, i);
      else if (action === 'delete') deleteCourse(p, i);
      else if (action === 'up' && i > 0) { swap(p.courses, i, i - 1); afterCourseChange(p); }
      else if (action === 'down' && i < p.courses.length - 1) { swap(p.courses, i, i + 1); afterCourseChange(p); }
    });
  }

  const addBtn = $('#btn-add-course');
  if (addBtn) addBtn.addEventListener('click', () => openCourseModal(p, -1));
}

function swap(arr, a, b) {
  [arr[a], arr[b]] = [arr[b], arr[a]];
}

function afterCourseChange(p) {
  markDirty();
  renderProviderList();
  renderContent();
  renderStats();
}

/* --- provider CRUD --- */
function addProvider() {
  const id = uniqueId('new-provider');
  const provider = {
    id,
    name: 'New Provider',
    description: '',
    logo: 'NEW',
    logoImage: '',
    color: '#00E5FF',
    courses: []
  };
  state.data.providers.push(provider);
  state.selectedId = id;
  markDirty();
  renderProviderList();
  renderContent();
  renderStats();
  const nameInput = $('#admin-content [data-field="name"]');
  if (nameInput) { nameInput.focus(); nameInput.select(); }
  toast('Provider added', '➕');
}

function deleteProvider(p) {
  if (!confirm(`Delete provider "${p.name}" and its ${(p.courses || []).length} course(s)?`)) return;
  state.data.providers = state.data.providers.filter(x => x !== p);
  state.selectedId = state.data.providers[0]?.id || null;
  markDirty();
  renderProviderList();
  renderContent();
  renderStats();
  toast('Provider deleted', '🗑️');
}

/* --- course CRUD --- */
function openCourseModal(p, index) {
  state.modalProviderId = p.id;
  state.editingCourseIndex = index;

  const list = $('#category-list');
  list.innerHTML = currentCategories().map(c => `<option value="${escapeHtml(c)}"></option>`).join('');

  const c = index >= 0 ? p.courses[index] : {
    title: '', description: '', difficulty: 'Beginner',
    certification: false, duration: '', category: '', url: '', pricing: 'free'
  };

  const form = $('#course-form');
  const f = form.elements;
  f.title.value = c.title || '';
  f.description.value = c.description || '';
  f.difficulty.value = DIFFICULTIES.includes(c.difficulty) ? c.difficulty : 'Beginner';
  f.category.value = c.category || '';
  f.duration.value = c.duration || '';
  f.pricing.value = PRICINGS.includes(c.pricing) ? c.pricing : 'free';
  f.certification.checked = !!c.certification;
  f.url.value = c.url || '';

  $('#course-modal-title').textContent = index >= 0 ? 'Edit Course' : 'Add Course';
  $('#course-modal').hidden = false;
  f.title.focus();
}

function closeCourseModal() {
  $('#course-modal').hidden = true;
  state.modalProviderId = null;
  state.editingCourseIndex = -1;
}

function saveCourseModal() {
  const p = state.data.providers.find(x => x.id === state.modalProviderId);
  if (!p) return;
  const form = $('#course-form');
  const f = form.elements;

  const title = f.title.value.trim();
  const url = f.url.value.trim();
  if (!title) { toast('Title is required', '⚠️'); f.title.focus(); return; }
  if (!url) { toast('Course URL is required', '⚠️'); f.url.focus(); return; }

  const course = {
    title,
    description: f.description.value.trim(),
    difficulty: f.difficulty.value,
    certification: f.certification.checked,
    duration: f.duration.value.trim(),
    category: f.category.value.trim(),
    url,
    pricing: f.pricing.value
  };

  const editing = state.editingCourseIndex >= 0;
  if (editing) p.courses[state.editingCourseIndex] = course;
  else p.courses.push(course);

  closeCourseModal();
  afterCourseChange(p);
  toast(editing ? 'Course updated' : 'Course added', editing ? '✏️' : '➕');
}

function deleteCourse(p, index) {
  const c = p.courses[index];
  if (!c) return;
  if (!confirm(`Delete course "${c.title}"?`)) return;
  p.courses.splice(index, 1);
  afterCourseChange(p);
  toast('Course deleted', '🗑️');
}

/* --- import / export --- */
function exportData() {
  recomputeStats(state.data);
  download('courses.json', JSON.stringify(state.data, null, 2));
  toast('courses.json downloaded — commit it to update the live site', '⬇️');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!isValidData(data)) throw new Error('Missing providers array');
      state.data = data;
      recomputeStats(state.data);
      state.selectedId = state.data.providers[0]?.id || null;
      markDirty();
      renderProviderList();
      renderContent();
      renderStats();
      toast('Imported successfully', '📥');
    } catch (e) {
      toast(`Import failed: ${e.message}`, '❌');
    }
  };
  reader.readAsText(file);
}

async function reloadServer() {
  if (state.isDraft && !confirm('Discard your local draft and reload from the server?')) return;
  try {
    state.data = await fetchServerData();
    recomputeStats(state.data);
    state.selectedId = state.data.providers[0]?.id || null;
    state.isDraft = false;
    localStorage.removeItem(STORAGE_KEY);
    showDraftBanner(false);
    renderProviderList();
    renderContent();
    renderStats();
    toast('Reloaded from server', '🔄');
  } catch (e) {
    toast(`Reload failed: ${e.message}`, '❌');
  }
}

async function discardDraft() {
  if (!confirm('Discard all local draft changes?')) return;
  localStorage.removeItem(STORAGE_KEY);
  await reloadServer();
}

/* --- provider page generator --- */
function buildProviderPageHtml(p) {
  const color = /^#([0-9a-f]{6})$/i.test(p.color) ? p.color : '#00E5FF';
  const name = p.name || 'Provider';
  const desc = p.description || '';
  const logoText = escapeHtml(p.logo || name.slice(0, 3).toUpperCase());
  const logo = p.logoImage
    ? `<div class="banner-logo" style="color:${color}"><img src="../${escapeHtml(p.logoImage)}" alt="${escapeHtml(name)}" style="max-height:100%;width:auto"></div>`
    : `<div class="banner-logo" style="color:${color}">${logoText}</div>`;
  const certCount = (p.courses || []).filter(c => c.certification).length;
  const courseCount = (p.courses || []).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="theme-color" content="#0A0A0A">
  <meta property="og:title" content="${escapeHtml(name)} | Laksh Learns">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(name)} | Laksh Learns">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2300E5FF'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Arial' font-weight='bold' font-size='16' fill='%230A0A0A'%3ELL%3C/text%3E%3C/svg%3E">
  <title>${escapeHtml(name)} | Laksh Learns</title>
  <link rel="stylesheet" href="../style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', var(--font); }
    .provider-banner { background: linear-gradient(135deg, var(--bg), ${color}15); }
  </style>
</head>
<body class="provider-page" data-provider="${escapeHtml(p.id)}">

  <div class="loading-screen" id="loading-screen">
    <div class="loader-content">
      <div class="loader-logo">Laksh Learns</div>
      <div class="loader-bar"><div class="loader-bar-inner"></div></div>
    </div>
  </div>

  <div class="scroll-progress" id="scroll-progress"></div>
  <div class="nav-overlay" id="nav-overlay"></div>
  <div class="custom-cursor"></div>
  <div class="custom-cursor-dot"></div>
  <div class="noise"></div>
  <div class="galaxy"></div>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="blob blob-3"></div>
  <canvas id="particle-canvas"></canvas>
  <div class="page-transition"><div class="transition-layer"></div></div>

  <nav class="navbar">
    <div class="navbar-inner">
      <a href="../index.html" class="nav-logo">Laksh Learns</a>
      <div class="nav-links">
        <a href="../index.html#providers">Providers</a>
        <a href="../index.html#stats">Stats</a>
        <a href="../bookmarks.html">Bookmarks</a>
        <a href="https://github.com/LnAigal/" target="_blank" rel="noopener noreferrer">GitHub</a>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">🌙</button>
      </div>
      <button class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </nav>

  <section class="provider-banner">
    <div class="provider-banner-inner">
      ${logo}
      <div class="banner-info">
        <h1>${escapeHtml(name)}</h1>
        <p>${escapeHtml(desc)}</p>
        <div class="banner-stats">
          <div class="banner-stat"><strong>${courseCount}</strong> Courses</div>
          <div class="banner-stat"><strong>${certCount}</strong> Certifications</div>
        </div>
      </div>
    </div>
  </section>

  <section class="controls-bar">
    <div class="controls-inner">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="course-search" placeholder="Search courses...">
      </div>
      <div class="filter-btns" id="filter-btns">
        <div class="sort-wrapper">
          <label class="filter-group-label">Sort</label>
          <select class="filter-select" id="sort-select">
            <option value="default">Sort by</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="difficulty-asc">Difficulty (Low\u2192High)</option>
            <option value="difficulty-desc">Difficulty (High\u2192Low)</option>
            <option value="duration-asc">Duration (Short\u2192Long)</option>
            <option value="duration-desc">Duration (Long\u2192Short)</option>
          </select>
        </div>
      </div>
    </div>
  </section>

  <div class="courses-grid" id="courses-container"></div>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <h3>Laksh Learns</h3>
        <p>One Place For All Learning Resources.</p>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <a href="../index.html#providers">All Providers</a>
        <a href="../bookmarks.html">Bookmarks</a>
        <a href="../index.html#stats">Statistics</a>
      </div>
      <div class="footer-col">
        <h4>Providers</h4>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Laksh Learns. All rights reserved.</p>
    </div>
  </footer>

  <button class="back-to-top" id="back-to-top" aria-label="Back to top">\u2191</button>
  <script src="../script.js"><\/script>
</body>
</html>
`;
}

function downloadProviderPage(p) {
  download(`${p.id}.html`, buildProviderPageHtml(p), 'text/html');
  toast(`Downloaded ${p.id}.html — place it in providers/`, '⬇️');
}

/* --- theme --- */
function initTheme() {
  const toggle = $('#theme-toggle');
  if (!toggle) return;
  if (localStorage.getItem(THEME_KEY) === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    toggle.textContent = '☀️';
  }
  toggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      toggle.textContent = '🌙';
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      toggle.textContent = '☀️';
      localStorage.setItem(THEME_KEY, 'light');
    }
  });
}

/* --- wiring --- */
function bindActions() {
  $('#btn-add-provider').addEventListener('click', addProvider);
  $('#provider-search').addEventListener('input', renderProviderList);
  $('#btn-export').addEventListener('click', exportData);
  $('#btn-reload').addEventListener('click', reloadServer);
  $('#btn-discard').addEventListener('click', discardDraft);

  $('#btn-import').addEventListener('click', () => $('#import-input').click());
  $('#import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importData(file);
    e.target.value = '';
  });

  $('#course-save').addEventListener('click', saveCourseModal);
  $('#course-cancel').addEventListener('click', closeCourseModal);
  $('#course-modal-close').addEventListener('click', closeCourseModal);
  $('#course-modal').addEventListener('click', (e) => {
    if (e.target === $('#course-modal')) closeCourseModal();
  });
  $('#course-form').addEventListener('submit', (e) => { e.preventDefault(); saveCourseModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#course-modal').hidden) closeCourseModal();
  });
}

/* --- init --- */
async function init() {
  initTheme();
  bindActions();

  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) { draft = null; }

  if (isValidData(draft)) {
    state.data = draft;
    state.isDraft = true;
    showDraftBanner(true);
  } else {
    try {
      state.data = await fetchServerData();
    } catch (e) {
      $('#admin-content').innerHTML = `<div class="panel"><div class="empty-state">Failed to load ${DATA_URL}. Open this page from a local server (not file://).<br><br>${escapeHtml(e.message)}</div></div>`;
      toast('Failed to load data', '❌');
      return;
    }
  }

  recomputeStats(state.data);
  state.selectedId = state.data.providers[0]?.id || null;
  renderStats();
  renderProviderList();
  renderContent();
}

document.addEventListener('DOMContentLoaded', init);
