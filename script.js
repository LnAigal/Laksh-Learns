// === DATA ===
let coursesData = null;
let currentProvider = null;

function durationToHours(d) {
  if (!d) return Infinity;
  const lower = d.toLowerCase();
  if (lower.includes('week')) return parseInt(d) * 40 || Infinity;
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

// === CUSTOM CURSOR ===
function initCursor() {
  const cursor = document.querySelector('.custom-cursor');
  const dot = document.querySelector('.custom-cursor-dot');
  if (!cursor || !dot) return;

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

  const hoverEls = document.querySelectorAll('a, button, .provider-card, .course-card, .stat-card, .filter-select, .sort-btn, .course-btn, .fav-btn, .back-to-top, .theme-toggle, .hamburger, .nav-logo, input, select');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
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
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      if (navOverlay) navOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    function openMenu() {
      hamburger.classList.add('active');
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
  }
}

function getThemeMetaColor() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return isLight ? '#F1F5F9' : '#0A0A0A';
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
  const saved = localStorage.getItem('ll-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    toggle.innerHTML = '☀️';
    updateThemeColor();
  }
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'light') {
      document.documentElement.removeAttribute('data-theme');
      toggle.innerHTML = '🌙';
      localStorage.setItem('ll-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      toggle.innerHTML = '☀️';
      localStorage.setItem('ll-theme', 'light');
    }
    updateThemeColor();
  });
}

// === BACK TO TOP ===
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// === ANIMATED COUNTERS ===
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        if (isNaN(target)) return;
        let current = 0;
        const increment = Math.ceil(target / 60);
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            entry.target.textContent = target;
            clearInterval(timer);
          } else {
            entry.target.textContent = current;
          }
        }, 25);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// === FAVORITES ===
function initFavorites() {
  const favs = JSON.parse(localStorage.getItem('ll-favs') || '[]');

  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.dataset.id;
    if (favs.includes(id)) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const idx = favs.indexOf(id);
      if (idx > -1) {
        favs.splice(idx, 1);
        btn.classList.remove('active');
        showToast('Removed from bookmarks', '💔');
      } else {
        favs.push(id);
        btn.classList.add('active');
        showToast('Added to bookmarks', '💖');
      }
      localStorage.setItem('ll-favs', JSON.stringify(favs));
    });
  });
}

// === TOAST ===
function showToast(msg, icon = '✅') {
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

// === PROVIDER COURSES RENDER ===
function renderCourses(courses, container) {
  if (!container) return;
  container.innerHTML = '';

  if (!courses || courses.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No courses found</h3>
        <p>Try adjusting your search or filters</p>
      </div>`;
    return;
  }

  const provider = coursesData.providers.find(p => p.id === currentProvider);
  const accentColor = provider ? provider.color : '#00E5FF';
  const favs = JSON.parse(localStorage.getItem('ll-favs') || '[]');

  courses.forEach((course, idx) => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.index = idx;
    card.style.setProperty('--accent', accentColor);
    card.style.animation = `fadeInUp 0.5s ease ${idx * 0.05}s both`;

    const certText = course.certification ? '🎓 Certificate' : 'No Certificate';
    const certTag = course.certification ? 'tag-certification' : 'tag-duration';
    const isFav = favs.includes(`${currentProvider}-${course.title}`);
    const detailUrl = `${window.location.pathname.includes('/providers/') ? '../' : ''}course.html?provider=${currentProvider}&course=${idx}`;

    card.innerHTML = `
      <h3 class="course-title"><a href="${detailUrl}" class="course-title-link" data-transition>${course.title}</a></h3>
      <p class="course-desc">${course.description}</p>
      <div class="course-tags">
        <span class="course-tag tag-difficulty">📊 ${course.difficulty}</span>
        <span class="course-tag ${certTag}">${certText}</span>
        <span class="course-tag tag-duration">⏱ ${course.duration}</span>
        <span class="course-tag tag-category">📂 ${course.category}</span>
      </div>
      <div class="course-footer">
        <a href="${course.url}" target="_blank" class="course-btn">Visit Course →</a>
        <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${currentProvider}-${course.title}" aria-label="Bookmark">${isFav ? '💖' : '🤍'}</button>
      </div>`;

    container.appendChild(card);
  });

  initFavorites();
  initCardTilt(container.querySelectorAll('.course-card'));
}

// === SEARCH & FILTER ===
function initProviderControls() {
  const searchInput = document.getElementById('course-search');
  const coursesContainer = document.getElementById('courses-container');
  const filterBtns = document.getElementById('filter-btns');
  if (!searchInput || !coursesContainer) return;

  let allCourses = [];
  let activeFilters = { difficulty: null, category: null, certification: null };
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
    activeFilters = { difficulty: null, category: null, certification: null };
    filterBtns.querySelectorAll('.filter-select').forEach(s => s.value = '');
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
      return true;
    });
    renderCourses(sortCourses(filtered), coursesContainer);
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
    allCourses = provider.courses;

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
  document.querySelectorAll('.btn, .course-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// === SCROLL REVEAL ===
function initScrollReveal() {
  const els = document.querySelectorAll('.section, .stat-card, .provider-card, .course-card');
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
    if (el.classList.contains('course-card')) return;
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
  document.querySelectorAll('[data-transition]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const overlay = document.querySelector('.page-transition');
      const layer = overlay ? overlay.querySelector('.transition-layer') : null;
      if (overlay && layer) {
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = href; }, 500);
      } else {
        window.location.href = href;
      }
    });
  });
}

// === HERO INTERACTIVE ===
function initHeroInteractive() {
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
    card.style.animation = `fadeInUp 0.6s ease ${idx * 0.08}s both`;

    const logoHtml = provider.logoImage
      ? `<div class="provider-logo" style="color: ${provider.color}"><img src="${provider.logoImage}" alt="${provider.name}" class="provider-logo-img"></div>`
      : `<div class="provider-logo" style="color: ${provider.color}">${provider.logo}</div>`;

    card.innerHTML = `
      <div class="card-glow"></div>
      ${logoHtml}
      <h3 class="provider-name">${provider.name}</h3>
      <p class="provider-meta">
        <span>${provider.courses.length} courses</span>
      </p>
      <div class="provider-meta">
        <span class="provider-count">${provider.courses.filter(c => c.certification).length} certifications</span>
      </div>
      <div class="provider-cta">Browse Courses →</div>`;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const glow = card.querySelector('.card-glow');
      if (glow) {
        glow.style.left = (e.clientX - rect.left - 100) + 'px';
        glow.style.top = (e.clientY - rect.top - 100) + 'px';
      }
    });

    grid.appendChild(card);
  });

  initMagneticButtons();
  setTimeout(initScrollReveal, 100);
}

// === HOME PAGE STATS ===
function renderStats(stats) {
  const grid = document.getElementById('stats-grid');
  if (!grid || !stats) return;

  const items = [
    { icon: '📚', count: stats.totalProviders, label: 'Total Providers' },
    { icon: '📖', count: stats.totalCourses, label: 'Total Courses' },
    { icon: '🎓', count: stats.totalCertifications, label: 'Certifications' }
  ];

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animation = `fadeInUp 0.6s ease ${0.8 + idx * 0.15}s both`;
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

  const certText = course.certification ? '🎓 Certificate' : 'No Certificate';
  const certTag = course.certification ? 'tag-certification' : 'tag-duration';

  container.innerHTML = `
    <div class="detail-card" style="--accent:${provider.color}">
      <div class="detail-header">
        <div class="detail-provider">
          <span class="detail-provider-badge" style="color:${provider.color};background:${provider.color}15;border-color:${provider.color}30">${provider.name}</span>
        </div>
        <h1 class="detail-title">${course.title}</h1>
        <div class="course-tags">
          <span class="course-tag tag-difficulty">📊 ${course.difficulty}</span>
          <span class="course-tag ${certTag}">${certText}</span>
          <span class="course-tag tag-duration">⏱ ${course.duration}</span>
          <span class="course-tag tag-category">📂 ${course.category}</span>
        </div>
      </div>
      <p class="detail-desc">${course.description}</p>
      <div class="detail-actions">
        <a href="${course.url}" target="_blank" class="btn btn-primary btn-glow">Visit Course →</a>
        <button class="fav-btn detail-fav ${isFav ? 'active' : ''}" data-id="${providerId}-${course.title}" aria-label="Bookmark">${isFav ? '💖' : '🤍'} <span>${isFav ? 'Bookmarked' : 'Bookmark'}</span></button>
      </div>
      <a href="providers/${providerId}.html" class="detail-back" data-transition>← Back to ${provider.name}</a>
    </div>`;

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
        <div class="no-results-icon">🔖</div>
        <h3>No bookmarked courses</h3>
        <p>Start bookmarking courses to see them here!</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  bookmarked.forEach((item, i) => {
    const { provider, course, idx } = item;
    const card = document.createElement('div');
    card.className = 'course-card';
    card.style.setProperty('--accent', provider.color);
    card.style.animation = `fadeInUp 0.5s ease ${i * 0.05}s both`;

    const certText = course.certification ? '🎓 Certificate' : 'No Certificate';
    const certTag = course.certification ? 'tag-certification' : 'tag-duration';
    const detailUrl = `${window.location.pathname.includes('/providers/') ? '../' : ''}course.html?provider=${provider.id}&course=${idx}`;

    card.innerHTML = `
      <div class="course-provider-badge" style="color:${provider.color};font-size:0.75rem;font-weight:600;margin-bottom:0.5rem">${provider.name}</div>
      <h3 class="course-title"><a href="${detailUrl}" class="course-title-link" data-transition>${course.title}</a></h3>
      <p class="course-desc">${course.description}</p>
      <div class="course-tags">
        <span class="course-tag tag-difficulty">📊 ${course.difficulty}</span>
        <span class="course-tag ${certTag}">${certText}</span>
        <span class="course-tag tag-duration">⏱ ${course.duration}</span>
        <span class="course-tag tag-category">📂 ${course.category}</span>
      </div>
      <div class="course-footer">
        <a href="${course.url}" target="_blank" class="course-btn">Visit Course →</a>
        <button class="fav-btn active" data-id="${item.id}" aria-label="Remove bookmark">💖</button>
      </div>`;

    container.appendChild(card);
  });

  initFavorites();
  initCardTilt(container.querySelectorAll('.course-card'));
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
  const history = getHistory();
  if (history.length === 0) {
    container.style.display = 'none';
    const header = document.querySelector('.history-section .section-header');
    if (header) header.style.display = 'none';
    return;
  }
  container.style.display = '';
  const header = document.querySelector('.history-section .section-header');
  if (header) header.style.display = '';
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
    card.style.animation = `fadeInUp 0.4s ease ${i * 0.05}s both`;
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
    card.style.animation = `fadeInUp 0.4s ease ${i * 0.05}s both`;

    const detailUrl = `course.html?provider=${provider.id}&course=${idx}`;
    const certText = course.certification ? '🎓 Certificate' : 'No Certificate';
    const certTag = course.certification ? 'tag-certification' : 'tag-duration';

    card.innerHTML = `
      <div class="course-provider-badge" style="color:${provider.color};font-size:0.75rem;font-weight:600;margin-bottom:0.5rem">${provider.name}</div>
      <h3 class="course-title"><a href="${detailUrl}" class="course-title-link" data-transition>${course.title}</a></h3>
      <p class="course-desc">${course.description}</p>
      <div class="course-tags">
        <span class="course-tag tag-difficulty">📊 ${course.difficulty}</span>
        <span class="course-tag ${certTag}">${certText}</span>
        <span class="course-tag tag-category">📂 ${course.category}</span>
      </div>
      <div class="course-footer">
        <a href="${course.url}" target="_blank" class="course-btn">Visit Course →</a>
      </div>`;

    grid.appendChild(card);
  });
}

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const dataPromise = loadData();
    const minDelay = new Promise(r => setTimeout(r, 800));
    await Promise.all([dataPromise, minDelay]);

    initLoading();
    initGalaxy();
    initParticles();
    initCursor();
    initScrollProgress();
    initNavbar();
    initTheme();
    initBackToTop();
    initFloatingIcons();

    if (document.body.classList.contains('home-page') && coursesData) {
      renderProviders(coursesData.providers);
      renderStats(coursesData.stats);
      initHeroInteractive();
      initParallax();
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
    initScrollReveal();
  } catch (e) {
    console.error('Init error:', e);
  }
});
