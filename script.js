// === DATA ===
let coursesData = null;
let currentProvider = null;

function durationToHours(d) {
  if (!d) return Infinity;
  const lower = d.toLowerCase();
  if (lower.includes('week')) return parseInt(d) * 40 || Infinity;

  let hours = 0;
  const days = lower.match(/(\d+)\s*d/);
  const hrs = lower.match(/(\d+)\s*h/);
  const mins = lower.match(/(\d+)\s*m/);
  if (days) hours += parseInt(days[1]) * 24;
  if (hrs) hours += parseInt(hrs[1]);
  if (mins) hours += parseInt(mins[1]) / 60;
  if (hours > 0) return hours;

  if (lower.includes('hour') || lower.includes('hr')) return parseInt(d) || 0;
  return Infinity;
}

function difficultyRank(d) {
  const ranks = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
  return ranks[d] ?? 0;
}

async function loadData() {
  try {
    const base = window.location.pathname.includes('/providers/') ? '../data/courses.json' : 'data/courses.json';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(base, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) { console.error('Fetch failed:', res.status); return null; }
    coursesData = await res.json();
    return coursesData;
  } catch (e) {
    console.error('loadData error:', e);
    return null;
  }
}

// === LOADING SCREEN ===
function initLoading() {
  const loader = document.getElementById('loading-screen');
  if (!loader) return;
  loader.classList.add('hidden');
  document.body.style.overflow = '';
}

// === TOUCH DETECTION ===
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// === CUSTOM CURSOR ===
function initCursor() {
  if (isTouchDevice()) return;
  const cursor = document.querySelector('.custom-cursor');
  const dot = document.querySelector('.custom-cursor-dot');
  if (!cursor || !dot) return;

  // Enable custom cursor via class (no more cursor:none on body by default)
  document.body.classList.add('custom-cursor-active');

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  function animate() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(animate);
  }
  animate();

  const HOVER_SELECTOR = 'a, button, .provider-card, .course-card, .stat-card, .filter-select, .sort-btn, .course-btn, .fav-btn, .back-to-top, .theme-toggle, .hamburger, .nav-logo, input, select, .hero-search';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)) cursor.classList.add('hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOVER_SELECTOR))) {
      cursor.classList.remove('hovering');
    }
  });
}

// === PARTICLE BACKGROUND ===
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > w) this.speedX *= -1;
      if (this.y < 0 || this.y > h) this.speedY *= -1;
    }
    draw() {
      const rgb = getParticleRGB();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${this.opacity})`;
      ctx.fill();
    }
  }

  const particleCount = Math.min(50, Math.floor(w * h / 15000));
  particles = Array.from({ length: particleCount }, () => new Particle());
  let frameCount = 0;

  function connect() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < 22500) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const rgb = getParticleRGB();
          ctx.strokeStyle = `rgba(${rgb}, ${0.05 * (1 - Math.sqrt(dist) / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    if (frameCount++ % 2 === 0) connect();
    requestAnimationFrame(animate);
  }
  animate();
}

// === GALAXY STARS ===
function initGalaxy() {
  const galaxy = document.querySelector('.galaxy');
  if (!galaxy) return;
  const count = 200;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'galaxy-star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
    star.style.setProperty('--min-opacity', (Math.random() * 0.3 + 0.1));
    star.style.animationDelay = Math.random() * 5 + 's';
    galaxy.appendChild(star);
  }
}

// === SCROLL PROGRESS ===
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    bar.style.width = scrolled + '%';
  });
}

// === NAVBAR ===
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  });

  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.getElementById('nav-overlay');
  if (hamburger && navLinks) {
    function closeMenu() {
      const focusWasInside = navLinks.contains(document.activeElement);
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      if (navOverlay) navOverlay.classList.remove('active');
      document.body.style.overflow = '';
      if (focusWasInside) hamburger.focus({ preventScroll: true });
    }
    function openMenu() {
      hamburger.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
      if (navOverlay) navOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    hamburger.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
    if (navOverlay) {
      navOverlay.addEventListener('click', closeMenu);
    }
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 820 && navLinks.classList.contains('open')) closeMenu();
    });
  }
}

function getThemeMetaColor() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark ? '#0f0f0c' : '#f5f2eb';
}

function updateThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getThemeMetaColor();
}

function getParticleRGB() {
  const style = getComputedStyle(document.documentElement);
  return `${style.getPropertyValue('--particle-r').trim()}, ${style.getPropertyValue('--particle-g').trim()}, ${style.getPropertyValue('--particle-b').trim()}`;
}

// === THEME TOGGLE ===
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    toggle.innerHTML = isDark ? '☀' : '☾';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem('ll-theme', isDark ? 'dark' : 'light');
    updateThemeColor();
  }

  applyTheme(localStorage.getItem('ll-theme') === 'dark' ? 'dark' : 'light');

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });
}

// === BACK TO TOP ===
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  const footerBottom = document.querySelector('.footer-bottom');

  function update() {
    const footerVisible = footerBottom
      ? footerBottom.getBoundingClientRect().top < window.innerHeight
      : false;
    btn.classList.toggle('visible', window.scrollY > 500 && !footerVisible);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// === ANIMATED COUNTERS (Spring-eased) ===
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  function formatNumber(n) {
    return n.toLocaleString();
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        if (isNaN(target)) return;
        const duration = 1800;
        const startTime = performance.now();
        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const value = Math.round(easeOutExpo(progress) * target);
          entry.target.textContent = formatNumber(value);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// === SVG ICONS ===
const SVG_HEART_OUTLINE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const SVG_HEART_FILLED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#c64120" stroke="#c64120" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// === FAVORITES ===
function initFavorites() {
  const favs = JSON.parse(localStorage.getItem('ll-favs') || '[]');

  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.dataset.id;
    function paint(active) {
      btn.classList.toggle('active', active);
      btn.innerHTML = btn.classList.contains('detail-fav')
        ? `${active ? SVG_HEART_FILLED : SVG_HEART_OUTLINE}<span>${active ? 'Bookmarked' : 'Bookmark'}</span>`
        : (active ? SVG_HEART_FILLED : SVG_HEART_OUTLINE);
    }
    paint(favs.includes(id));
    btn.addEventListener('click', () => {
      const idx = favs.indexOf(id);
      if (idx > -1) {
        favs.splice(idx, 1);
        paint(false);
        showToast('Removed from bookmarks', '−');
      } else {
        favs.push(id);
        paint(true);
        showToast('Added to bookmarks', '+');
      }
      localStorage.setItem('ll-favs', JSON.stringify(favs));

      if (idx > -1) {
        const card = btn.closest('#bookmarks-container .course-card');
        if (card) {
          card.remove();
          if (!document.querySelector('#bookmarks-container .course-card')) renderBookmarkedCourses();
        }
      }
    });
  });
}

// === TOAST ===
function showToast(msg, icon = '✓') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span class="toast-icon">${icon}</span> ${msg}`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// === SHARE BUTTONS ===
function initShareButtons() {
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.dataset.url;
      const title = btn.dataset.title || 'Check out this course';
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch (err) {
          if (err.name !== 'AbortError') {
            fallbackCopy(url);
          }
        }
      } else {
        fallbackCopy(url);
      }
    });
  });

  function fallbackCopy(url) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard', '↗');
    }).catch(() => {
      showToast('Could not copy link', '!');
    });
  }
}

// === PROVIDER COURSES RENDER ===
function renderCourses(courses, container) {
  if (!container) return;
  container.innerHTML = '';

  if (!courses || courses.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">✳</div>
        <h3>No courses found</h3>
        <p>Try adjusting your search or filters</p>
      </div>`;
    return;
  }

  const provider = coursesData.providers.find(p => p.id === currentProvider);
  const accentColor = provider ? provider.color : '#c64120';
  const favs = JSON.parse(localStorage.getItem('ll-favs') || '[]');

  courses.forEach((course, idx) => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.index = idx;
    card.style.setProperty('--accent', accentColor);

    const certText = course.certification ? 'Certificate' : 'No certificate';
    const certTag = course.certification ? 'tag-certification' : 'tag-duration';
    const isFav = favs.includes(`${currentProvider}-${course.title}`);
    const detailUrl = `${window.location.pathname.includes('/providers/') ? '../' : ''}course.html?provider=${currentProvider}&course=${course.__idx != null ? course.__idx : idx}`;

    card.innerHTML = `
      <h3 class="course-title"><a href="${detailUrl}" class="course-title-link" data-transition>${course.title}</a></h3>
      <span class="pricing-badge ${course.pricing === 'free' ? 'badge-free' : 'badge-paid'}">${course.pricing === 'free' ? 'Free' : 'Paid'}</span>
      <p class="course-desc">${course.description}</p>
      <div class="course-tags">
        <span class="course-tag tag-difficulty">${course.difficulty}</span>
        <span class="course-tag ${certTag}">${certText}</span>
        <span class="course-tag tag-duration">${course.duration}</span>
        <span class="course-tag tag-category">${course.category}</span>
      </div>
      <div class="course-footer">
        <a href="${course.url}" target="_blank" rel="noopener noreferrer" class="course-btn">Visit course</a>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button class="share-btn" data-url="${course.url}" data-title="${course.title}" aria-label="Share">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${currentProvider}-${course.title}" aria-label="Bookmark">${isFav ? SVG_HEART_FILLED : SVG_HEART_OUTLINE}</button>
        </div>
      </div>`;

    container.appendChild(card);
  });

  initFavorites();
  initShareButtons();
}

// === SEARCH & FILTER ===
function initProviderControls() {
  const searchInput = document.getElementById('course-search');
  const coursesContainer = document.getElementById('courses-container');
  const filterBtns = document.getElementById('filter-btns');
  if (!searchInput || !coursesContainer) return;

  let allCourses = [];
  let activeFilters = { difficulty: null, category: null, certification: null, pricing: null };
  let sortOrder = 'default';

  function sortCourses(courses) {
    const sorted = [...courses];
    switch (sortOrder) {
      case 'name-asc': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'name-desc': sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'difficulty-asc': sorted.sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty)); break;
      case 'difficulty-desc': sorted.sort((a, b) => difficultyRank(b.difficulty) - difficultyRank(a.difficulty)); break;
      case 'duration-asc': sorted.sort((a, b) => durationToHours(a.duration) - durationToHours(b.duration)); break;
      case 'duration-desc': sorted.sort((a, b) => durationToHours(b.duration) - durationToHours(a.duration)); break;
    }
    return sorted;
  }

  function clearFilters() {
    activeFilters = { difficulty: null, category: null, certification: null, pricing: null };
    sortOrder = 'default';
    filterBtns.querySelectorAll('.filter-select').forEach(s => s.value = s.id === 'sort-select' ? 'default' : '');
    updateActivePills();
    renderFiltered();
  }

  function updateActivePills() {
    let existing = document.querySelector('.active-pills');
    if (!existing) {
      existing = document.createElement('div');
      existing.className = 'active-pills';
      if (filterBtns.parentNode) filterBtns.parentNode.insertBefore(existing, filterBtns.nextSibling);
    }

    const chips = [];
    if (activeFilters.difficulty) chips.push({ label: activeFilters.difficulty, group: 'difficulty' });
    if (activeFilters.category) chips.push({ label: activeFilters.category, group: 'category' });
    if (activeFilters.certification === true) chips.push({ label: 'Certificate', group: 'certification' });
    else if (activeFilters.certification === false) chips.push({ label: 'No Certificate', group: 'certification' });
    if (activeFilters.pricing === 'free') chips.push({ label: 'Free', group: 'pricing' });
    else if (activeFilters.pricing === 'paid') chips.push({ label: 'Paid', group: 'pricing' });

    const clearBtn = document.getElementById('filter-clear');
    if (chips.length === 0) {
      existing.innerHTML = '';
      existing.style.display = 'none';
      if (clearBtn) clearBtn.classList.remove('show');
      return;
    }
    existing.style.display = 'flex';
    if (clearBtn) clearBtn.classList.add('show');
    existing.innerHTML = chips.map(c => `<span class="pill" data-group="${c.group}">${c.label} <span class="pill-remove">&times;</span></span>`).join('');

    existing.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const group = pill.dataset.group;
        activeFilters[group] = null;
        const sel = filterBtns.querySelector(`.filter-select[data-group="${group}"]`);
        if (sel) sel.value = '';
        updateActivePills();
        renderFiltered();
      });
    });
  }

  function renderFiltered() {
    const query = searchInput.value.toLowerCase();
    const filtered = allCourses.filter(c => {
      if (query && !c.title.toLowerCase().includes(query) && !c.description.toLowerCase().includes(query)) return false;
      if (activeFilters.difficulty && c.difficulty !== activeFilters.difficulty) return false;
      if (activeFilters.category && c.category !== activeFilters.category) return false;
      if (activeFilters.certification !== null && c.certification !== activeFilters.certification) return false;
      if (activeFilters.pricing && c.pricing !== activeFilters.pricing) return false;
      return true;
    });
    renderCourses(sortCourses(filtered), coursesContainer);

    // Show result count
    let countEl = document.getElementById('result-count');
    if (!countEl) {
      countEl = document.createElement('div');
      countEl.id = 'result-count';
      countEl.className = 'result-count';
      coursesContainer.parentNode.insertBefore(countEl, coursesContainer);
    }
    const isFiltered = query || activeFilters.difficulty || activeFilters.category || activeFilters.certification !== null || activeFilters.pricing;
    if (isFiltered) {
      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${allCourses.length}</strong> courses`;
      countEl.style.display = '';
    } else {
      countEl.style.display = 'none';
    }
  }

  function buildFilters() {
    if (!filterBtns) return;
    const difficulties = [...new Set(allCourses.map(c => c.difficulty))];
    const categories = [...new Set(allCourses.map(c => c.category))];
    const hasCert = allCourses.some(c => c.certification);
    const hasNoCert = allCourses.some(c => !c.certification);

    const groups = [];

    groups.push({ label: 'Difficulty', options: difficulties.map(d => ({ label: d, value: d, group: 'difficulty' })) });
    groups.push({ label: 'Category', options: categories.map(c => ({ label: c, value: c, group: 'category' })) });

    const certOptions = [];
    if (hasCert) certOptions.push({ label: 'Certificate', value: 'certification-true', group: 'certification' });
    if (hasNoCert) certOptions.push({ label: 'No Certificate', value: 'certification-false', group: 'certification' });
    if (certOptions.length) groups.push({ label: 'Certification', options: certOptions });

    const hasFree = allCourses.some(c => c.pricing === 'free');
    const hasPaid = allCourses.some(c => c.pricing === 'paid');
    const pricingOptions = [];
    if (hasFree) pricingOptions.push({ label: 'Free', value: 'pricing-free', group: 'pricing' });
    if (hasPaid) pricingOptions.push({ label: 'Paid', value: 'pricing-paid', group: 'pricing' });
    if (pricingOptions.length) groups.push({ label: 'Pricing', options: pricingOptions });

    const sortWrapper = filterBtns.querySelector('.sort-wrapper');

    filterBtns.innerHTML = groups.map(g => `
      <div class="filter-group">
        <label class="filter-group-label">${g.label}</label>
        <select class="filter-select" data-group="${g.options[0].group}">
          <option value="">All</option>
          ${g.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>
      </div>
    `).join('') + `<button class="filter-clear" id="filter-clear">Clear</button>`;

    if (sortWrapper) filterBtns.appendChild(sortWrapper);

    filterBtns.querySelectorAll('.filter-select:not(#sort-select)').forEach(sel => {
      sel.addEventListener('change', () => {
        const group = sel.dataset.group;
        const val = sel.value;

        if (group === 'difficulty') activeFilters.difficulty = val || null;
        else if (group === 'category') activeFilters.category = val || null;
        else if (group === 'certification') {
          activeFilters.certification = val === 'certification-true' ? true : val === 'certification-false' ? false : null;
        }
        else if (group === 'pricing') {
          activeFilters.pricing = val === 'pricing-free' ? 'free' : val === 'pricing-paid' ? 'paid' : null;
        }

        updateActivePills();
        renderFiltered();
      });
    });

    const clearBtn = document.getElementById('filter-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
  }

  function loadCourses() {
    const providerId = document.body.dataset.provider;
    if (!coursesData) return;
    const provider = coursesData.providers.find(p => p.id === providerId);
    if (!provider) return;
    currentProvider = providerId;
    allCourses = provider.courses.map((course, idx) => ({ ...course, __idx: idx }));

    const statEls = document.querySelectorAll('.banner-stat strong');
    if (statEls.length >= 2) {
      statEls[0].textContent = provider.courses.length;
      statEls[1].textContent = provider.courses.filter(c => c.certification).length;
    }

    buildFilters();
    renderFiltered();
  }

  searchInput.addEventListener('input', renderFiltered);

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortOrder = sortSelect.value;
      renderFiltered();
    });
  }

  loadCourses();
}

// === CARD TILT ===
function initCardTilt(cards) {
  if (isTouchDevice()) return;
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// === MAGNETIC BUTTONS ===
function initMagneticButtons() {
  if (isTouchDevice()) return;
  document.addEventListener('mousemove', (e) => {
    const btn = e.target.closest && e.target.closest('.btn, .course-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  document.addEventListener('mouseout', (e) => {
    const btn = e.target.closest && e.target.closest('.btn, .course-btn');
    if (btn && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.btn, .course-btn'))) {
      btn.style.transform = '';
    }
  });
}

// === SCROLL REVEAL ===
function initScrollReveal() {
  const els = document.querySelectorAll('.section, .stat-card, .provider-card');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// === PARALLAX ===
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroContent = hero.querySelector('.hero-content');
    if (heroContent && scrolled < hero.offsetHeight) {
      heroContent.style.transform = `translateY(${scrolled * 0.15}px)`;
      heroContent.style.opacity = 1 - scrolled / (hero.offsetHeight * 0.8);
    }
  });
}

// === PAGE TRANSITION ===
function initPageTransitions() {
  const overlay = document.querySelector('.page-transition');
  if (overlay) overlay.classList.remove('active');
  window.addEventListener('pageshow', () => {
    if (overlay) overlay.classList.remove('active');
  });
  window.addEventListener('pagehide', () => {
    if (overlay) overlay.classList.remove('active');
  });
}

// === HERO INTERACTIVE ===
function initHeroInteractive() {
  if (isTouchDevice()) return;
  const hero = document.querySelector('.hero-content');
  if (!hero) return;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const title = hero.querySelector('.hero-title');
    if (title) {
      title.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
    }
  });
  hero.addEventListener('mouseleave', () => {
    const title = hero.querySelector('.hero-title');
    if (title) title.style.transform = '';
  });
}

// === HOMEPAGE PROVIDER RENDER ===
function renderProviders(providers) {
  const grid = document.getElementById('providers-grid');
  if (!grid || !providers) return;

  providers.forEach((provider, idx) => {
    const card = document.createElement('a');
    card.href = `providers/${provider.id}.html`;
    card.className = 'provider-card';
    card.setAttribute('data-transition', '');
    card.style.setProperty('--accent', provider.color);

    const logoHtml = provider.logoImage
      ? `<div class="provider-logo" style="color: ${provider.color}"><img src="${provider.logoImage}" alt="${provider.name}" class="provider-logo-img"></div>`
      : `<div class="provider-logo provider-logo-fallback" style="--brand: ${provider.color}">${provider.logo}</div>`;

    card.innerHTML = `
      <div class="card-glow"></div>
      ${logoHtml}
      <h3 class="provider-name">${provider.name}</h3>
      <p class="provider-desc">${provider.description}</p>
      <p class="provider-meta">
        <span>${provider.courses.length} courses</span>
      </p>
      <div class="provider-meta">
        <span class="provider-count">${provider.courses.filter(c => c.certification).length} certifications</span>
      </div>
      <div class="provider-cta">Browse courses</div>`;

    grid.appendChild(card);
  });

}

// === HOME PAGE TRUST STRIP ===
function renderTrustLogos(providers) {
  const row = document.getElementById('trust-logos');
  if (!row || !providers) return;
  providers.forEach(provider => {
    const item = document.createElement('span');
    item.className = 'trust-logo';
    item.title = provider.name;
    item.textContent = provider.name;
    row.appendChild(item);
  });
}

function hydrateHeroStats(stats) {
  if (!stats) return;
  const courseCount = document.getElementById('hero-course-count');
  const providerCount = document.getElementById('hero-provider-count');
  if (courseCount) courseCount.textContent = stats.totalCourses;
  if (providerCount) providerCount.textContent = stats.totalProviders;
}

// === HOME PAGE STATS ===
function renderStats(stats) {
  const grid = document.getElementById('stats-grid');
  if (!grid || !stats) return;

  const items = [
    { icon: '01', count: stats.totalCourses, label: 'Hand-picked courses' },
    { icon: '02', count: stats.totalProviders, label: 'Trusted providers' },
    { icon: '03', count: stats.totalCertifications, label: 'Certificate pathways' },
    { icon: '04', count: stats.totalFree, label: 'Free to start' }
  ];

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
      <div class="stat-icon-wrap"><span class="stat-icon">${item.icon}</span></div>
      <div class="stat-number" data-count="${item.count}">0</div>
      <div class="stat-label">${item.label}</div>`;
    grid.appendChild(card);
  });

  setTimeout(initCounters, 500);
}

// === FLOATING ICONS ===
function initFloatingIcons() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const icons = ['📚', '💻', '🤖', '🌐', '🔬', '📊', '🎯', '⚡', '🧠', '🚀'];
  icons.forEach((icon, i) => {
    const el = document.createElement('div');
    el.className = 'floating-icon';
    el.textContent = icon;
    el.style.left = Math.random() * 80 + 10 + '%';
    el.style.top = Math.random() * 80 + 10 + '%';
    el.style.fontSize = (Math.random() * 1.5 + 1.2) + 'rem';
    el.style.animationDelay = (Math.random() * 5) + 's';
    el.style.animationDuration = (Math.random() * 4 + 4) + 's';
    hero.appendChild(el);
  });
}

// === COURSE DETAIL ===
function initCourseDetail() {
  const params = new URLSearchParams(window.location.search);
  const providerId = params.get('provider');
  const courseIdx = parseInt(params.get('course'));

  const container = document.getElementById('course-detail');
  if (!container || !coursesData || !providerId || isNaN(courseIdx)) {
    if (container) container.innerHTML = '<div class="no-results"><h3>Course not found</h3><p>Invalid or missing course information.</p><a href="index.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Go Home →</a></div>';
    return;
  }

  const provider = coursesData.providers.find(p => p.id === providerId);
  if (!provider || !provider.courses[courseIdx]) {
    container.innerHTML = '<div class="no-results"><h3>Course not found</h3><p>The course you are looking for does not exist.</p><a href="index.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Go Home →</a></div>';
    return;
  }

  currentProvider = providerId;
  const course = provider.courses[courseIdx];
  const favs = JSON.parse(localStorage.getItem('ll-favs') || '[]');
  const isFav = favs.includes(`${providerId}-${course.title}`);

  saveHistory(providerId, courseIdx, course.title, provider.name);

  document.title = `${course.title} | Laksh Learns`;

  const certText = course.certification ? 'Certificate' : 'No certificate';
  const certTag = course.certification ? 'tag-certification' : 'tag-duration';

  container.innerHTML = `
    <nav class="detail-breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Home</a><span>/</span>
      <a href="providers/${providerId}.html">${provider.name}</a><span>/</span>
      <span>Course</span>
    </nav>
    <article class="detail-card" style="--accent:${provider.color}">
      <div class="detail-main">
        <div class="detail-header">
          <div class="detail-provider">
            <span class="detail-provider-badge">${provider.name}</span>
          </div>
          <h1 class="detail-title">${course.title}</h1>
          <div class="detail-topics">
            <span class="pricing-badge ${course.pricing === 'free' ? 'badge-free' : 'badge-paid'}">${course.pricing === 'free' ? 'Free' : 'Paid'}</span>
            <span class="course-tag ${certTag}">${certText}</span>
          </div>
        </div>
        <p class="detail-desc">${course.description}</p>
        <div class="detail-facts">
          <div class="detail-fact"><span>Level</span><strong>${course.difficulty}</strong></div>
          <div class="detail-fact"><span>Duration</span><strong>${course.duration}</strong></div>
          <div class="detail-fact"><span>Category</span><strong>${course.category}</strong></div>
        </div>
        <a href="providers/${providerId}.html" class="detail-back" data-transition>← Back to ${provider.name}</a>
      </div>
      <aside class="detail-aside">
        <div class="detail-cta-card">
          <span class="eyebrow">Start learning</span>
          <h2>Ready when you are.</h2>
          <p>This course opens directly on ${provider.name}. Continue on their official platform at your own pace.</p>
          <a href="${course.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Visit course <span aria-hidden="true">↗</span></a>
          <button class="fav-btn detail-fav ${isFav ? 'active' : ''}" data-id="${providerId}-${course.title}" aria-label="Bookmark">${isFav ? SVG_HEART_FILLED : SVG_HEART_OUTLINE}<span>${isFav ? 'Bookmarked' : 'Bookmark'}</span></button>
          <div class="detail-cta-note">Official provider link. Pricing, availability, and certificates are managed by ${provider.name}.</div>
        </div>
      </aside>
    </article>`;

  initFavorites();
}

// === BOOKMARKED COURSES PAGE ===
function renderBookmarkedCourses() {
  const container = document.getElementById('bookmarks-container');
  if (!container || !coursesData) return;

  const favs = JSON.parse(localStorage.getItem('ll-favs') || '[]');

  const bookmarked = [];
  coursesData.providers.forEach(provider => {
    provider.courses.forEach((course, idx) => {
      const id = `${provider.id}-${course.title}`;
      if (favs.includes(id)) {
        bookmarked.push({ provider, course, idx, id });
      }
    });
  });

  if (bookmarked.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <div class="no-results-icon">✳</div>
        <h3>No bookmarked courses yet</h3>
        <p>Browse providers and bookmark courses you love! Here are some to get started:</p>
        <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;margin-top:1.3rem">
          <a href="providers/gfg.html" class="btn btn-secondary" data-transition>GeeksforGeeks</a>
          <a href="providers/scaler.html" class="btn btn-secondary" data-transition>Scaler</a>
          <a href="providers/google.html" class="btn btn-secondary" data-transition>Google Skillshop</a>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = '';
  bookmarked.forEach((item, i) => {
    const { provider, course, idx } = item;
    const card = document.createElement('div');
    card.className = 'course-card';
    card.style.setProperty('--accent', provider.color);

    const certText = course.certification ? 'Certificate' : 'No certificate';
    const certTag = course.certification ? 'tag-certification' : 'tag-duration';
    const detailUrl = `${window.location.pathname.includes('/providers/') ? '../' : ''}course.html?provider=${provider.id}&course=${idx}`;

    card.innerHTML = `
      <div class="course-provider-badge" style="color:${provider.color};font-size:0.75rem;font-weight:600;margin-bottom:0.5rem">${provider.name}</div>
      <h3 class="course-title"><a href="${detailUrl}" class="course-title-link" data-transition>${course.title}</a></h3>
      <span class="pricing-badge ${course.pricing === 'free' ? 'badge-free' : 'badge-paid'}">${course.pricing === 'free' ? 'Free' : 'Paid'}</span>
      <p class="course-desc">${course.description}</p>
      <div class="course-tags">
        <span class="course-tag tag-difficulty">${course.difficulty}</span>
        <span class="course-tag ${certTag}">${certText}</span>
        <span class="course-tag tag-duration">${course.duration}</span>
        <span class="course-tag tag-category">${course.category}</span>
      </div>
      <div class="course-footer">
        <a href="${course.url}" target="_blank" rel="noopener noreferrer" class="course-btn">Visit course</a>
        <button class="fav-btn active" data-id="${item.id}" aria-label="Remove bookmark">${SVG_HEART_FILLED}</button>
      </div>`;

    container.appendChild(card);
  });

  initFavorites();
}

// === RECENTLY VIEWED ===
const HISTORY_KEY = 'll-history';
const MAX_HISTORY = 10;

function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function saveHistory(providerId, courseIdx, title, providerName) {
  let history = getHistory();
  history = history.filter(h => !(h.providerId === providerId && h.courseIdx === courseIdx));
  history.unshift({ providerId, courseIdx, title, providerName, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  if (!coursesData) return;
  const container = document.getElementById('history-container');
  if (!container) return;
  const section = document.querySelector('.history-section');
  const history = getHistory();
  if (history.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';
  container.innerHTML = '';
  history.forEach((item, i) => {
    const provider = coursesData.providers.find(p => p.id === item.providerId);
    const course = provider ? provider.courses[item.courseIdx] : null;
    if (!provider || !course) return;
    const card = document.createElement('a');
    card.href = `course.html?provider=${item.providerId}&course=${item.courseIdx}`;
    card.className = 'history-card';
    card.setAttribute('data-transition', '');
    card.style.setProperty('--accent', provider.color);
    card.innerHTML = `
      <div class="history-card-top">
        <span class="history-provider" style="color:${provider.color}">${provider.name}</span>
        <span class="history-time">${timeAgo(item.timestamp)}</span>
      </div>
      <h4 class="history-title">${course.title}</h4>
    `;
    container.appendChild(card);
  });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// === SIMILAR COURSES ===
function getSimilarCourses(providerId, courseIdx) {
  if (!coursesData) return [];
  const currentProvider = coursesData.providers.find(p => p.id === providerId);
  if (!currentProvider) return [];
  const currentCourse = currentProvider.courses[courseIdx];
  if (!currentCourse) return [];

  const scored = [];
  coursesData.providers.forEach(provider => {
    provider.courses.forEach((course, idx) => {
      if (provider.id === providerId && idx === courseIdx) return;
      let score = 0;
      if (course.category === currentCourse.category) score += 2;
      if (course.difficulty === currentCourse.difficulty) score += 1;
      if (score > 0) scored.push({ provider, course, idx, score });
    });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

function renderSimilarCourses() {
  const container = document.getElementById('similar-courses');
  if (!container || !coursesData) return;
  const params = new URLSearchParams(window.location.search);
  const providerId = params.get('provider');
  const courseIdx = parseInt(params.get('course'));

  const similar = getSimilarCourses(providerId, courseIdx);
  if (similar.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  const grid = container.querySelector('.similar-grid') || container;
  grid.innerHTML = '';

  similar.forEach((item, i) => {
    const { provider, course, idx } = item;
    const card = document.createElement('div');
    card.className = 'course-card similar-card';
    card.style.setProperty('--accent', provider.color);

    const detailUrl = `course.html?provider=${provider.id}&course=${idx}`;
    const certText = course.certification ? 'Certificate' : 'No certificate';
    const certTag = course.certification ? 'tag-certification' : 'tag-duration';

    card.innerHTML = `
      <div class="course-provider-badge" style="color:${provider.color};font-size:0.75rem;font-weight:600;margin-bottom:0.5rem">${provider.name}</div>
      <h3 class="course-title"><a href="${detailUrl}" class="course-title-link" data-transition>${course.title}</a></h3>
      <span class="pricing-badge ${course.pricing === 'free' ? 'badge-free' : 'badge-paid'}">${course.pricing === 'free' ? 'Free' : 'Paid'}</span>
      <p class="course-desc">${course.description}</p>
      <div class="course-tags">
        <span class="course-tag tag-difficulty">${course.difficulty}</span>
        <span class="course-tag ${certTag}">${certText}</span>
        <span class="course-tag tag-duration">${course.duration}</span>
        <span class="course-tag tag-category">${course.category}</span>
      </div>
      <div class="course-footer">
        <a href="${course.url}" target="_blank" rel="noopener noreferrer" class="course-btn">Visit course</a>
      </div>`;

    grid.appendChild(card);
  });
}

// === GLOBAL SEARCH (Ctrl+K / Cmd+K) ===
function initGlobalSearch() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'search-overlay';
  overlay.innerHTML = `
    <div class="search-modal" role="dialog" aria-modal="true" aria-label="Search courses">
      <div class="search-modal-header">
        <span class="search-modal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input type="text" class="search-modal-input" placeholder="Search all courses…" aria-label="Search all courses" autocomplete="off" />
        <button type="button" class="search-modal-kbd" aria-label="Close search">ESC</button>
      </div>
      <div class="search-modal-results" id="search-modal-results"></div>
      <div class="search-modal-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Open</span>
        <span><kbd>ESC</kbd> Close</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.search-modal-input');
  const results = overlay.querySelector('.search-modal-results');
  let focusIdx = -1;
  let currentResults = [];

  let lastTrigger = null;

  function openSearch() {
    const active = document.activeElement;
    lastTrigger = active && active !== document.body && active !== document.documentElement ? active : null;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    input.value = '';
    results.innerHTML = '';
    focusIdx = -1;
    renderSearchHints();
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  }

  function closeSearch() {
    overlay.classList.remove('active');
    document.body.style.overflow = document.querySelector('.nav-links.open') ? 'hidden' : '';
    input.blur();
    const returnTarget = lastTrigger || document.querySelector('.hero-search, [data-search-open], .nav-logo');
    if (returnTarget) returnTarget.focus({ preventScroll: true });
  }

  function renderSearchHints() {
    if (!coursesData) return;
    results.innerHTML = `
      <div class="search-modal-empty">
        <div class="search-modal-empty-icon">⌘</div>
        <p>Search across <strong>${coursesData.stats.totalCourses}</strong> courses from <strong>${coursesData.stats.totalProviders}</strong> providers</p>
      </div>
    `;
  }

  function performSearch(query) {
    if (!coursesData || !query.trim()) {
      renderSearchHints();
      currentResults = [];
      return;
    }
    const q = query.toLowerCase();
    const matches = [];
    coursesData.providers.forEach(provider => {
      provider.courses.forEach((course, idx) => {
        const titleMatch = course.title.toLowerCase().includes(q);
        const descMatch = course.description.toLowerCase().includes(q);
        const catMatch = course.category.toLowerCase().includes(q);
        const providerMatch = provider.name.toLowerCase().includes(q);
        if (titleMatch || descMatch || catMatch || providerMatch) {
          matches.push({
            provider,
            course,
            idx,
            score: titleMatch ? 3 : (providerMatch ? 2 : (catMatch ? 1 : 0))
          });
        }
      });
    });
    matches.sort((a, b) => b.score - a.score);
    currentResults = matches.slice(0, 12);

    if (currentResults.length === 0) {
      results.innerHTML = `
        <div class="search-modal-empty">
          <div class="search-modal-empty-icon">✳</div>
          <p>No courses found for "<strong>${escapeHtml(query)}</strong>"</p>
        </div>
      `;
      return;
    }

    focusIdx = -1;
    results.innerHTML = currentResults.map((item, i) => {
      const base = window.location.pathname.includes('/providers/') ? '../' : '';
      const url = `${base}course.html?provider=${item.provider.id}&course=${item.idx}`;
      return `
        <a href="${url}" class="search-result-item" data-idx="${i}" data-transition>
          <span class="search-result-provider" style="color:${item.provider.color};border-color:${item.provider.color}30">${item.provider.name}</span>
          <div class="search-result-info">
            <div class="search-result-title">${item.course.title}</div>
            <div class="search-result-meta">
              <span>${item.course.difficulty}</span>
              <span>${item.course.duration}</span>
              <span>${item.course.pricing === 'free' ? 'Free' : 'Paid'}</span>
            </div>
          </div>
          <span class="search-result-arrow">→</span>
        </a>
      `;
    }).join('');
  }

  function updateFocus() {
    results.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.classList.toggle('focused', i === focusIdx);
      if (i === focusIdx) el.scrollIntoView({ block: 'nearest' });
    });
  }

  input.addEventListener('input', () => performSearch(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIdx = Math.min(focusIdx + 1, currentResults.length - 1);
      updateFocus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIdx = Math.max(focusIdx - 1, 0);
      updateFocus();
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault();
      const el = results.querySelector(`.search-result-item[data-idx="${focusIdx}"]`);
      if (el) el.click();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  overlay.querySelector('.search-modal-kbd').addEventListener('click', closeSearch);

  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !overlay.classList.contains('active')) return;
    const focusable = [...overlay.querySelectorAll('a[href], button, input')]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Keyboard shortcut: Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Hero search bar trigger
  document.querySelectorAll('[data-search-open], .hero-search').forEach(trigger => {
    trigger.addEventListener('click', openSearch);
  });

  const heroSearch = document.querySelector('.hero-search');
  if (heroSearch) {
    heroSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSearch();
      }
    });
  }
}

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load data without artificial delay
    await loadData();
    initLoading();

    initScrollProgress();
    initNavbar();
    initTheme();
    initBackToTop();

    if (document.body.classList.contains('home-page') && coursesData) {
      renderProviders(coursesData.providers);
      renderTrustLogos(coursesData.providers);
      hydrateHeroStats(coursesData.stats);
      renderStats(coursesData.stats);
      renderHistory();
    }

    if (document.body.classList.contains('provider-page')) {
      initProviderControls();
    }

    if (document.body.classList.contains('course-detail-page')) {
      initCourseDetail();
      renderSimilarCourses();
    }

    if (document.body.classList.contains('bookmarks-page')) {
      renderBookmarkedCourses();
    }

    initPageTransitions();
    initGlobalSearch();
  } catch (e) {
    console.error('Init error:', e);
  }
});
