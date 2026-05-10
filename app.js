// ── State ─────────────────────────────────────────────────
const STORAGE_KEY = 'vnTrackerData';
const defaults = { games:[], playthroughs:[], reviews:[], settings:{ theme:'light', backgroundUrl:'', avatarUrl:'', tagline:'VN Enthusiast' } };

const Icons = {
  check:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`,
  trash:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  edit:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  heart:`<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  drop:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  download:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  fileText:`<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
};

function loadData() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (!d) return JSON.parse(JSON.stringify(defaults));
    const p = JSON.parse(d);
    if (!p.settings) p.settings = { theme:'light', backgroundUrl:'', avatarUrl:'', tagline:'VN Enthusiast' };
    if (!p.settings.tagline) p.settings.tagline = 'VN Enthusiast';
    if (p.settings.avatarUrl === undefined) p.settings.avatarUrl = '';
    if (!p.reviews) p.reviews = [];
    return p;
  } catch(e) { return JSON.parse(JSON.stringify(defaults)); }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  applySettings();
}

let appData = loadData();

function applySettings() {
  const s = appData.settings;
  document.documentElement.setAttribute('data-theme', s.theme === 'dark' ? 'dark' : '');
  if (s.backgroundUrl) {
    document.body.style.backgroundImage = `url('${s.backgroundUrl}')`;
    document.body.classList.add('has-custom-bg');
  } else {
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-custom-bg');
  }
  // Update avatar display
  const av = document.getElementById('avatar-btn');
  if (av) {
    if (s.avatarUrl) {
      av.style.backgroundImage = `url('${s.avatarUrl}')`;
    } else {
      av.style.backgroundImage = '';
    }
  }
}
applySettings();

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ── DOM refs ──────────────────────────────────────────────
const viewContainer = document.getElementById('view-container');
const pageTitle     = document.getElementById('page-title');
const navLinks      = document.querySelectorAll('.nav-links a');
const modalContainer= document.getElementById('modal-container');
const modalBody     = document.getElementById('modal-body');

// ── Nav ───────────────────────────────────────────────────
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderView(e.currentTarget.dataset.view);
  });
});

// ── Router ────────────────────────────────────────────────
let currentView = 'dashboard', currentParam = null;
function renderView(view, param) {
  currentView = view; currentParam = param;
  // Clear any timers
  if (window._heroInterval) { clearInterval(window._heroInterval); window._heroInterval = null; }
  
  viewContainer.innerHTML = '';
  viewContainer.style.animation = 'none';
  requestAnimationFrame(() => { viewContainer.style.animation = ''; });
  const titles = { dashboard:'Dashboard', library:'My Library', 'add-game':'Add Visual Novel', analytics:'Analytics' };
  pageTitle.textContent = titles[view] || '';
  if (view === 'dashboard') renderDashboard();
  else if (view === 'library') renderLibrary();
  else if (view === 'add-game') renderAddGame();
  else if (view === 'analytics') renderAnalytics();
  else if (view === 'game-details') {
    const g = appData.games.find(g => g.id === param);
    if (g) { pageTitle.textContent = g.title; renderGameDetails(g); }
    else renderView('library');
  }
}

// ── Helpers ───────────────────────────────────────────────
function statusBadge(s) {
  const cls = { 'Not Started':'status-paused', Playing:'status-playing', Completed:'status-completed', Dropped:'status-dropped', Paused:'status-paused' }[s] || 'status-playing';
  return `<span class="status-badge ${cls}">${s}</span>`;
}

function daysBetween(a, b) {
  if (!a || !b) return '';
  const d = Math.ceil(Math.abs(new Date(b)-new Date(a))/(86400000));
  return d === 0 ? 'Same day!' : `${d} day${d>1?'s':''}`;
}

function tagsHTML(tags, large) {
  if (!tags || !tags.length) return '';
  return tags.map(t => `<span class="tag-pill"${large?' style="padding:3px 12px;"':''}>${t}</span>`).join('');
}

function getAllTags() {
  const s = new Set();
  appData.games.forEach(g => (g.tags||[]).forEach(t => s.add(t)));
  return [...s].sort();
}

function setupTagAutocomplete(inputId) {
  const input = document.getElementById(inputId); if (!input) return;
  const existing = getAllTags();
  if (!existing.length) return;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;';
  existing.forEach(tag => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'tag-pill';
    pill.style.cssText = 'cursor:pointer;opacity:.6;transition:opacity .2s;font-size:.7rem;';
    pill.textContent = tag;
    pill.onmouseenter = () => { pill.style.opacity = '1'; };
    pill.onmouseleave = () => { pill.style.opacity = pill.dataset.active==='1'?'1':'.6'; };
    pill.onclick = () => {
      const cur = input.value.split(',').map(t=>t.trim()).filter(Boolean);
      if (cur.includes(tag)) {
        input.value = cur.filter(t=>t!==tag).join(', ');
        pill.style.opacity = '.6'; pill.dataset.active = '0';
      } else {
        cur.push(tag);
        input.value = cur.join(', ');
        pill.style.opacity = '1'; pill.dataset.active = '1';
      }
    };
    // Highlight if already selected
    const cur = input.value.split(',').map(t=>t.trim());
    if (cur.includes(tag)) { pill.style.opacity = '1'; pill.dataset.active = '1'; }
    wrap.appendChild(pill);
  });
  input.parentNode.appendChild(wrap);
}

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const total = appData.games.length;
  const done  = appData.playthroughs.filter(p => p.status==='Completed').length;
  const favs  = appData.playthroughs.filter(p => p.isFavorite);
  const playingPts = appData.playthroughs.filter(p => p.status==='Playing').length;
  const playingGames = appData.games.filter(g => 
    (g.status||'') === 'Playing' || appData.playthroughs.some(p => p.gameId === g.id && p.status === 'Playing')
  );
  const playing = playingGames.length;

  // Hero Carousel
  let heroHTML = '';
  if (playingGames.length > 0) {
    const slides = playingGames.map((g, index) => {
      const activeRoutes = appData.playthroughs.filter(p => p.gameId === g.id && p.status === 'Playing');
      const routeText = activeRoutes.length ? activeRoutes.map(p=>p.route).join(', ') : '';
      return `
        <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
          <div class="hero-bg" style="background-image: url('${g.coverUrl || 'https://via.placeholder.com/800x400'}')"></div>
          <div class="hero-gradient"></div>
          <div class="hero-content">
            <div class="hero-tag">Currently Playing</div>
            <h2 class="hero-title">${g.title}</h2>
            ${routeText ? `<p class="hero-desc"><strong>Routes:</strong> ${routeText}</p>` : ''}
            <p class="hero-desc">${g.description || ''}</p>
            <button class="btn btn-primary" onclick="renderView('game-details','${g.id}')">▶ Continue</button>
          </div>
        </div>
      `;
    }).join('');
    
    const dots = playingGames.map((g, index) => 
      `<div class="hero-dot ${index === 0 ? 'active' : ''}" onclick="window.setHeroSlide(${index})"></div>`
    ).join('');

    heroHTML = `
      <div class="hero-carousel" id="hero-carousel">
        ${slides}
        <div class="hero-arrow hero-arrow-left" onclick="window.moveHero(-1)">❮</div>
        <div class="hero-arrow hero-arrow-right" onclick="window.moveHero(1)">❯</div>
        <div class="hero-controls">${dots}</div>
      </div>
    `;
    
    let currentHeroIdx = 0;
    window.setHeroSlide = function(index) {
      currentHeroIdx = index;
      const carousel = document.getElementById('hero-carousel');
      if (!carousel) return;
      const slides = carousel.querySelectorAll('.hero-slide');
      const dotEls = carousel.querySelectorAll('.hero-dot');
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      dotEls.forEach((d, i) => d.classList.toggle('active', i === index));
    };

    window.moveHero = function(dir) {
      let next = currentHeroIdx + dir;
      if (next < 0) next = playingGames.length - 1;
      if (next >= playingGames.length) next = 0;
      window.setHeroSlide(next);
    };

    // Auto cycle
    if (playingGames.length > 1) {
      window._heroInterval = setInterval(() => window.moveHero(1), 5000);
    }
    window.setHeroSlide(0);
  } else {
    heroHTML = `
      <div class="hero-carousel" style="display:flex;align-items:center;justify-content:center;background:#1c2228;flex-direction:column;gap:1rem;">
        <div class="hero-tag">Welcome to VN Library</div>
        <h2 class="hero-title" style="font-size:2rem;margin:0;">Ready to start reading?</h2>
        <button class="btn btn-primary" onclick="renderView('add-game')" style="margin-top:1rem;">+ Add a Visual Novel</button>
      </div>
    `;
  }

  const recent = appData.playthroughs.slice().reverse().slice(0,6).map(p => {
    const g = appData.games.find(g => g.id===p.gameId);
    if (!g) return '';
    return `<div class="log-entry" onclick="renderView('game-details','${g.id}')" style="cursor:pointer;display:flex;align-items:center;gap:1rem;">
      <img src="${g.coverUrl||'https://via.placeholder.com/50x75'}" style="width:40px;height:60px;object-fit:cover;border-radius:2px;">
      <div>
        <div class="log-header" style="margin-bottom:0.2rem;">
          <span class="route-name" style="font-size:1rem;">${g.title} — ${p.route}</span>
        </div>
        ${statusBadge(p.status)}
      </div>
    </div>`;
  }).join('') || `<p style="color:var(--text-muted)">No activity yet.</p>`;

  viewContainer.innerHTML = `
    ${heroHTML}
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-title">Total VNs</span><span class="stat-value">${total}</span></div>
      <div class="stat-card"><span class="stat-title">Currently Playing</span><span class="stat-value">${playing}</span></div>
      <div class="stat-card"><span class="stat-title">Routes Completed</span><span class="stat-value">${done}</span></div>
      <div class="stat-card"><span class="stat-title">Fav Routes</span><span class="stat-value">${favs.length}</span></div>
    </div>
    <div>
      <h3 class="section-heading">Recent Activity</h3>
      <div class="trail-log" style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));margin-top:0;">
        ${recent}
      </div>
    </div>`;
}

// ── Library ───────────────────────────────────────────────
let libSearch = '', libPlatform = 'All', libStatus = 'All', libViewMode = localStorage.getItem('vnLibViewMode') || 'Grid M';
let libSort = localStorage.getItem('vnLibSort') || 'Recently Added';

function getGameAvgRating(gid) {
  const pts = appData.playthroughs.filter(p => p.gameId === gid);
  const pids = pts.map(p => p.id);
  const revs = appData.reviews.filter(r => pids.includes(r.playthroughId) && r.rating > 0);
  if (!revs.length) return 0;
  return revs.reduce((s,r) => s+r.rating, 0) / revs.length;
}

function getGameRouteCount(gid) {
  return appData.playthroughs.filter(p => p.gameId === gid).length;
}

function getGameCompletedCount(gid) {
  return appData.playthroughs.filter(p => p.gameId === gid && p.status === 'Completed').length;
}

function getLastPlayedDate(gid) {
  const pts = appData.playthroughs.filter(p => p.gameId === gid);
  if (!pts.length) return '';
  return pts.reduce((latest, p) => {
    const d = p.endDate || p.startDate || '';
    return d > latest ? d : latest;
  }, '');
}

function sortGames(games) {
  const sorted = [...games];
  switch(libSort) {
    case 'A-Z': return sorted.sort((a,b) => a.title.localeCompare(b.title));
    case 'Z-A': return sorted.sort((a,b) => b.title.localeCompare(a.title));
    case 'Recently Added': return sorted.reverse();
    case 'Recently Played': return sorted.sort((a,b) => {
      const da = getLastPlayedDate(a.id), db = getLastPlayedDate(b.id);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return db.localeCompare(da);
    });
    case 'Highest Rated': return sorted.sort((a,b) => getGameAvgRating(b.id) - getGameAvgRating(a.id));
    case 'Most Routes': return sorted.sort((a,b) => getGameRouteCount(b.id) - getGameRouteCount(a.id));
    default: return sorted;
  }
}

function renderLibrary() {
  const platforms = [...new Set(appData.games.map(g=>g.platform).filter(Boolean))];
  
  // Currently playing section
  // const nowPlaying = appData.games.filter(g => 
  //   (g.status||'') === 'Playing' || appData.playthroughs.some(p => p.gameId === g.id && p.status === 'Playing')
  // );
  // const nowPlayingHTML = nowPlaying.length ? `
  //   <div class="now-playing-section">
  //     <h3 class="section-heading" style="display:flex;align-items:center;gap:8px;">▶ Currently Playing <span class="now-playing-count">${nowPlaying.length}</span></h3>
  //     <div class="now-playing-strip">${nowPlaying.map(g => {
  //       const activeRoutes = appData.playthroughs.filter(p => p.gameId === g.id && p.status === 'Playing');
  //       return `<div class="now-playing-card" onclick="renderView('game-details','${g.id}')">
  //         <img src="${g.coverUrl||'https://via.placeholder.com/80x110?text=?'}" alt="${g.title}">
  //         <div class="now-playing-info">
  //           <div class="now-playing-title">${g.title}</div>
  //           <div class="now-playing-route">${activeRoutes.length ? activeRoutes.map(p=>p.route).join(', ') : 'No route started yet'}</div>
  //         </div>
  //       </div>`;
  //     }).join('')}</div>
  //   </div>` : '';

  // Backlog pick button
  const backlogGames = appData.games.filter(g => (g.status||'Want to Play') === 'Want to Play');
  const randomPickHTML = backlogGames.length >= 2 ? `<button class="btn btn-ghost random-pick-btn" id="random-pick-btn" title="Pick a random game from your backlog">🎲 Random Pick</button>` : '';

  viewContainer.innerHTML = `
    ${'' /* nowPlayingHTML */}
    <div class="filter-bar">
      <input type="text" id="lib-search" class="filter-input" style="flex:2;" placeholder="Search title, dev, tag…" value="${libSearch}">
      <select id="lib-platform" class="filter-input"><option value="All">All Platforms</option>${platforms.map(p=>`<option ${libPlatform===p?'selected':''}>${p}</option>`).join('')}</select>
      <select id="lib-status" class="filter-input">
        ${['All','Want to Play','Playing','Completed','Dropped','Paused'].map(s=>`<option value="${s}" ${libStatus===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <select id="lib-sort" class="filter-input">
        ${['Recently Added','A-Z','Z-A','Recently Played','Highest Rated','Most Routes'].map(s=>`<option value="${s}" ${libSort===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <select id="lib-view" class="filter-input">
        <option value="List" ${libViewMode==='List'?'selected':''}>☰ List</option>
        <option value="Grid S" ${libViewMode==='Grid S'?'selected':''}>▦ Grid S</option>
        <option value="Grid M" ${libViewMode==='Grid M'?'selected':''}>▦ Grid M</option>
        <option value="Grid L" ${libViewMode==='Grid L'?'selected':''}>▦ Grid L</option>
      </select>
      ${randomPickHTML}
    </div>
    <div id="lib-count" class="lib-count"></div>
    <div id="lib-grid"></div>`;
  document.getElementById('lib-search').oninput = e => { libSearch = e.target.value.toLowerCase(); drawGrid(); };
  document.getElementById('lib-platform').onchange = e => { libPlatform = e.target.value; drawGrid(); };
  document.getElementById('lib-status').onchange = e => { libStatus = e.target.value; drawGrid(); };
  document.getElementById('lib-sort').onchange = e => {
    libSort = e.target.value;
    localStorage.setItem('vnLibSort', libSort);
    drawGrid();
  };
  document.getElementById('lib-view').onchange = e => { 
    libViewMode = e.target.value; 
    localStorage.setItem('vnLibViewMode', libViewMode);
    drawGrid(); 
  };
  const rpBtn = document.getElementById('random-pick-btn');
  if (rpBtn) rpBtn.onclick = () => randomPick();
  drawGrid();
}

function randomPick() {
  const backlog = appData.games.filter(g => (g.status||'Want to Play') === 'Want to Play');
  if (!backlog.length) return;
  const pick = backlog[Math.floor(Math.random() * backlog.length)];
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:.75rem;">🎲</div>
      <h3 style="margin-bottom:.5rem;">You should play…</h3>
      <div style="margin:1.5rem auto;">
        <img src="${pick.coverUrl||'https://via.placeholder.com/180x260?text=?'}" alt="${pick.title}" style="width:160px;height:230px;object-fit:cover;border-radius:16px;box-shadow:var(--shadow-md);">
      </div>
      <h2 style="font-family:'Playfair Display',serif;color:var(--accent-primary);margin-bottom:.5rem;">${pick.title}</h2>
      ${pick.developer ? `<p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:.5rem;">${pick.developer}</p>` : ''}
      ${pick.tags && pick.tags.length ? `<div style="margin-bottom:1rem;">${tagsHTML(pick.tags, true)}</div>` : ''}
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button class="btn btn-ghost" style="flex:1;" onclick="randomPick()">🎲 Re-roll</button>
        <button class="btn btn-primary" style="flex:2;" onclick="closeModal();renderView('game-details','${pick.id}')">Let's Go!</button>
      </div>
    </div>`);
}
window.randomPick = randomPick;

function drawGrid() {
  const el = document.getElementById('lib-grid');
  const countEl = document.getElementById('lib-count');
  if (!el) return;
  if (!appData.games.length) {
    el.innerHTML = `<div class="empty-state"><h3>Your library is empty!</h3><p>Add your first visual novel to get started.</p><button class="btn btn-primary" onclick="renderView('add-game')">Add a VN</button></div>`;
    if (countEl) countEl.textContent = '';
    return;
  }
  let games = [...appData.games];
  if (libPlatform !== 'All') games = games.filter(g => g.platform === libPlatform);
  if (libStatus !== 'All') games = games.filter(g => (g.status||'Want to Play') === libStatus);
  if (libSearch) games = games.filter(g =>
    g.title.toLowerCase().includes(libSearch) ||
    (g.developer||'').toLowerCase().includes(libSearch) ||
    (g.tags||[]).some(t => t.toLowerCase().includes(libSearch)));
  
  if (countEl) countEl.textContent = `Showing ${games.length} of ${appData.games.length} games`;
  
  if (!games.length) { el.innerHTML = `<p style="color:var(--text-muted);padding:2rem 0;">No games match your filters.</p>`; return; }
  
  games = sortGames(games);
  
  let viewClass = 'library-grid';
  if (libViewMode.includes('Grid S')) viewClass = 'library-grid-s';
  else if (libViewMode.includes('Grid L')) viewClass = 'library-grid-l';
  else if (libViewMode.includes('List')) viewClass = 'library-list';
  
  el.innerHTML = `<div class="${viewClass}">${games.map(g => {
    const routeCount = getGameRouteCount(g.id);
    const completedCount = getGameCompletedCount(g.id);
    const avgRating = getGameAvgRating(g.id);
    const ratingStars = avgRating > 0 ? '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating)) : '';
    const statusClass = {'Playing':'status-playing','Completed':'status-completed','Dropped':'status-dropped','Paused':'status-paused'}[g.status] || '';
    
    // Progress badge
    const progressBadge = routeCount > 0 ? `<span class="card-badge card-badge-routes" title="${completedCount}/${routeCount} routes completed">${completedCount}/${routeCount}</span>` : '';
    const ratingBadge = avgRating > 0 ? `<span class="card-badge card-badge-rating" title="Average rating: ${avgRating.toFixed(1)}">${avgRating.toFixed(1)} ★</span>` : '';
    const statusMini = g.status && g.status !== 'Want to Play' ? `<span class="status-badge ${statusClass}" style="font-size:.6rem;padding:2px 8px;">${g.status}</span>` : '';
    
    if (viewClass === 'library-list') {
        return `
        <div class="lib-list-item" onclick="renderView('game-details','${g.id}')">
          <img src="${g.coverUrl||'https://via.placeholder.com/60x90?text=No+Cover'}" class="lib-list-cover">
          <div class="lib-list-main">
            <div class="lib-list-info">
              <div class="lib-list-title">${g.title}</div>
              <div class="lib-list-meta">${g.developer||'—'} • ${g.platform||'—'}</div>
            </div>
            <div class="lib-list-stats">
              <div style="width:120px; display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end;">${tagsHTML(g.tags)}</div>
              <div style="width:100px; text-align:right;">${statusMini}</div>
              <div class="lib-list-progress" style="width:80px; text-align:right; font-weight:700; color:var(--accent-primary);">${completedCount}/${routeCount}</div>
              <div style="width:80px; text-align:right;">${ratingBadge}</div>
            </div>
          </div>
        </div>`;
    }

    return `
    <div class="game-card" onclick="renderView('game-details','${g.id}')">
      <div class="game-cover-wrap">
        <img class="game-cover" src="${g.coverUrl||'https://via.placeholder.com/300x400?text=No+Cover'}" alt="${g.title}">
        <div class="card-badges">${progressBadge}${ratingBadge}</div>
      </div>
      <div class="game-info">
        <div class="game-title">${g.title}</div>
        ${g.developer ? `<span class="game-dev">${g.developer}</span>` : ''}
        <div class="game-meta-row">
          <span class="game-platform">${g.platform||'—'}</span>
          ${statusMini}
        </div>
        <div style="margin-top:5px;">${tagsHTML(g.tags)}</div>
        ${ratingStars ? `<div class="card-rating-stars">${ratingStars}</div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ── Add Game ──────────────────────────────────────────────
function renderAddGame() {
  viewContainer.innerHTML = `
    <div class="add-game-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:2.5rem; margin:0 auto; align-items: flex-start;">
      <div class="glass-panel cover-upload-section" style="display:flex; flex-direction:column; align-items:center; padding:2rem; position:sticky; top:2rem;">
        <img id="cover-prev" src="https://via.placeholder.com/240x340?text=Cover" style="width:100%; max-width:240px; aspect-ratio:2/3; object-fit:cover; border-radius:12px; margin-bottom:1.5rem; box-shadow:var(--shadow-md); border:1px solid var(--glass-border);">
        <div class="form-group" style="width:100%;">
          <label style="text-align:center; display:block;">Cover Image URL</label>
          <input type="url" id="g-cover" class="form-control" placeholder="Paste URL…" oninput="document.getElementById('cover-prev').src=this.value||'https://via.placeholder.com/240x340?text=Cover'" style="text-align:center;">
        </div>
        <div style="display:flex; gap:.75rem; width:100%; margin-top:.5rem;">
          <button type="button" class="btn btn-ghost" style="flex:1; font-size:.85rem;" onclick="cropCover()">✂️ Crop</button>
          <label class="btn btn-ghost" style="flex:1; font-size:.85rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">📁 File<input type="file" id="g-cover-file" accept="image/*" style="display:none;" onchange="coverFromFile(event)"></label>
        </div>
      </div>
      
      <div class="glass-panel" style="padding:2.5rem;">
        <h3 style="margin-bottom:1.5rem; color:var(--accent-primary); font-size:1.5rem;">Add New Visual Novel</h3>
        <form id="add-form">
          <div class="form-group"><label>Title *</label><input type="text" id="g-title" class="form-control" placeholder="e.g. Clannad, Our Life…" required></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
            <div class="form-group"><label>Developer</label><input type="text" id="g-dev" class="form-control" placeholder="e.g. Cheritz, Key…"></div>
            <div class="form-group">
              <label>Platform *</label>
              <input list="plat-list" id="g-platform" class="form-control" placeholder="Steam, Switch…" required>
              <datalist id="plat-list"><option>Steam</option><option>Itch.io</option><option>Nintendo Switch</option><option>PlayStation</option><option>Mobile</option></datalist>
            </div>
          </div>
          <div class="form-group">
            <label>Current Status</label>
            <select id="g-status" class="form-control" onchange="document.getElementById('g-start-date-container').style.display = this.value === 'Want to Play' ? 'none' : 'block'">
              <option>Want to Play</option><option>Playing</option><option>Completed</option><option>Paused</option><option>Dropped</option>
            </select>
          </div>
          <div class="form-group" id="g-start-date-container" style="display:none;">
            <label>Date Started</label>
            <input type="date" id="g-start-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group"><label>Tags (comma separated)</label><input type="text" id="g-tags" class="form-control" placeholder="Otome, Sci-Fi, Romance…"></div>
          <div class="form-group"><label>Synopsis / Description</label><textarea id="g-desc" class="form-control" rows="4" placeholder="What is this VN about?"></textarea></div>
          
          <div style="display:flex; gap:1rem; margin-top:2rem;">
            <button type="button" class="btn btn-ghost" style="flex:1;" onclick="renderView('library')">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex:2;">${Icons.check} Add to Library</button>
          </div>
        </form>
      </div>
    </div>`;
  setupTagAutocomplete('g-tags');
  document.getElementById('add-form').onsubmit = e => {
    e.preventDefault();
    const tags = document.getElementById('g-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
    const status = document.getElementById('g-status').value;
    const startDate = status !== 'Want to Play' ? document.getElementById('g-start-date').value : '';
    appData.games.push({ id:uid(), title:document.getElementById('g-title').value,
      developer:document.getElementById('g-dev').value, coverUrl:document.getElementById('g-cover').value,
      platform:document.getElementById('g-platform').value, status, startDate,
      tags, description:document.getElementById('g-desc').value });
    saveData(); renderView('library');
  };
}

// Cover crop/file helpers
window.cropCover = function() {
  const url = document.getElementById('g-cover').value;
  if (!url) { alert('Enter a cover URL first, then crop it.'); return; }
  openCropper(url, dataUrl => {
    document.getElementById('g-cover').value = dataUrl;
    document.getElementById('cover-prev').src = dataUrl;
  });
};
window.coverFromFile = function(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('g-cover').value = ev.target.result;
    document.getElementById('cover-prev').src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// ── Game Details ──────────────────────────────────────────
function renderGameDetails(game) {
  const pts = appData.playthroughs.filter(p => p.gameId === game.id);
  const completedCount = pts.filter(p=>p.status==='Completed').length;
  const progressPct = pts.length ? Math.round((completedCount/pts.length)*100) : 0;

  // Sort helper
  function sortPts(arr, sortMode) {
    const sorted = arr.slice();
    switch(sortMode) {
      case 'alpha-az': return sorted.sort((a,b) => a.route.localeCompare(b.route));
      case 'alpha-za': return sorted.sort((a,b) => b.route.localeCompare(a.route));
      case 'started-new': return sorted.sort((a,b) => (b.startDate||'').localeCompare(a.startDate||''));
      case 'started-old': return sorted.sort((a,b) => (a.startDate||'zzzz').localeCompare(b.startDate||'zzzz'));
      case 'status': return sorted.sort((a,b) => { const order={'Not Started':0,'Playing':1,'Paused':2,'Completed':3,'Dropped':4}; return (order[a.status]||9)-(order[b.status]||9); });
      default: return sorted.slice().reverse();
    }
  }

  function buildLogEntry(p) {
    const rev = appData.reviews.find(r => r.playthroughId===p.id);
    const stars = rev ? '★'.repeat(rev.rating)+'☆'.repeat(5-rev.rating) : '';
    const reviewBlock = rev ? `<div class="review-text">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div class="review-stars">${stars}</div>
        <button class="btn btn-ghost" style="font-size:.7rem;padding:.2rem .5rem;" onclick="openReviewModal('${p.id}','${game.id}')">${Icons.edit} Edit Review</button>
      </div>
      <span class="${rev.hasSpoilers?'spoiler-text':''}" onclick="this.classList.toggle('revealed')">${rev.content||'No text.'}</span>
      ${rev.hasSpoilers?'<small style="display:block;color:var(--pink);margin-top:4px;">Spoiler — click to reveal</small>':''}
    </div>` : '';

    const charBlock = (p.characterPhotoUrl||p.characterProfile) ? `
      <div class="character-profile-container">
        ${p.characterPhotoUrl?`<img class="character-photo" src="${p.characterPhotoUrl}" alt="Character">` : ''}
        ${p.characterProfile?`<div class="character-notes">${p.characterProfile}</div>` : ''}
        <button class="btn btn-ghost" style="margin-left:auto;font-size:.75rem;padding:.35rem .75rem;" onclick="openEditRouteModal('${p.id}','${game.id}')">${Icons.edit}</button>
      </div>` : `<button class="btn btn-ghost" style="font-size:.75rem;padding:.35rem .75rem;margin-top:.5rem;" onclick="openEditRouteModal('${p.id}','${game.id}')">${Icons.edit} Edit Character</button>`;

    const actions = p.status==='Not Started' ? `<div style="display:flex;gap:8px;margin-top:1rem;">
        <button class="btn btn-primary" onclick="startRoute('${p.id}','${game.id}')">▶ Start Playing</button>
      </div>`
    : p.status==='Playing' ? `<div style="display:flex;gap:8px;margin-top:1rem;">
        <button class="btn btn-success" onclick="openCompleteModal('${p.id}','${game.id}')">${Icons.check} Complete</button>
        <button class="btn btn-ghost" onclick="pauseRoute('${p.id}','${game.id}')">${Icons.drop} Pause</button>
        <button class="btn btn-ghost" onclick="dropRoute('${p.id}','${game.id}')">Drop</button>
      </div>`
    : p.status==='Paused' ? `<div style="display:flex;gap:8px;margin-top:1rem;">
        <button class="btn btn-primary" onclick="resumeRoute('${p.id}','${game.id}')">Resume</button>
        <button class="btn btn-success" onclick="openCompleteModal('${p.id}','${game.id}')">${Icons.check} Complete</button>
      </div>`
    : (!rev && p.status==='Completed') ? `<button class="btn btn-ghost" style="margin-top:1rem;" onclick="openReviewModal('${p.id}','${game.id}')">${Icons.edit} Write Review</button>` : '';

    const elapsed = p.status==='Completed' ? daysBetween(p.startDate,p.endDate) : '';
    const dateInfo = p.startDate ? `<span>Started: ${p.startDate}</span>` : `<span style="font-style:italic;">Not started yet</span>`;

    return `<div class="log-entry${p.isFavorite?' is-favorite':''}">
      <button onclick="deletePlaythrough('${p.id}','${game.id}')" title="Delete" style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:var(--text-muted);width:20px;height:20px;">${Icons.trash}</button>
      <div class="log-header">
        <span class="route-name">${p.route}</span>
        <button class="favorite-btn${p.isFavorite?' active':''}" onclick="toggleFav('${p.id}','${game.id}')" title="Favorite">${Icons.heart}</button>
        ${statusBadge(p.status)}
      </div>
      <div style="font-size:.82rem;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap;">
        ${dateInfo}
        ${p.endDate?`<span>Ended: ${p.endDate}</span>`:''}
        ${elapsed?`<span style="color:var(--pink);font-weight:600;">${elapsed}</span>`:''}
      </div>
      ${charBlock}${reviewBlock}${actions}
    </div>`;
  }

  const defaultSort = 'recent';
  const logsHTML = sortPts(pts, defaultSort).map(buildLogEntry).join('') || `<p style="color:var(--text-muted)">No routes logged yet. Add your characters!</p>`;

  const sortBar = pts.length ? `<div style="display:flex;gap:.5rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap;">
    <span style="font-size:.8rem;color:var(--text-muted);font-weight:600;">Sort:</span>
    <select id="trail-sort" class="form-control" style="width:auto;padding:.45rem .75rem;font-size:.8rem;border-radius:10px;" onchange="window._trailSort(this.value)">
      <option value="recent">Recently Added</option>
      <option value="alpha-az">A → Z</option>
      <option value="alpha-za">Z → A</option>
      <option value="started-new">Started (Newest)</option>
      <option value="started-old">Started (Oldest)</option>
      <option value="status">By Status</option>
    </select>
  </div>` : '';

  viewContainer.innerHTML = `
    <div class="game-details-header">
      <img class="game-details-cover" src="${game.coverUrl||'https://via.placeholder.com/200x290'}" alt="${game.title}">
      <div class="game-details-info">
        <h2 class="game-details-title">${game.title}</h2>
        ${game.developer?`<div class="game-dev" style="font-size:.95rem;margin-bottom:.5rem;">${game.developer}</div>`:''}
        <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:.75rem;">Platform: <strong style="color:var(--text-body);">${game.platform||'—'}</strong>
        ${game.startDate ? ` <span style="margin:0 8px;">|</span> Started: <strong style="color:var(--text-body);">${game.startDate}</strong>` : ''}</p>
        ${tagsHTML(game.tags, true) ? `<div style="margin-bottom:1rem;">${tagsHTML(game.tags,true)}</div>` : ''}
        ${game.description?`<p class="description-block">${game.description}</p>`:''}
        ${game.notes && game.notes !== '<p><br></p>' ? `<div class="game-notes-block" style="background:var(--bg-hover);padding:1rem;border-radius:12px;margin-bottom:1.5rem;border-left:4px solid var(--accent-primary);">
          <h4 style="margin-bottom:0;font-size:.9rem;color:var(--accent-primary);display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;" onclick="const c=this.nextElementSibling;const i=this.querySelector('.toggle-icon');if(c.style.display==='none'){c.style.display='block';i.style.transform='rotate(0deg)';}else{c.style.display='none';i.style.transform='rotate(-90deg)';}">
            <span style="display:flex;align-items:center;gap:6px;">${Icons.fileText} Personal Notes & Tips</span>
            <span class="toggle-icon" style="transition:transform 0.2s;font-size:1rem;transform:rotate(-90deg);">▼</span>
          </h4>
          <div class="rich-notes-content" style="display:none;font-size:.9rem;color:var(--text-body);line-height:1.6;margin-top:.75rem;">${game.notes}</div>
        </div>`:''}
        ${pts.length?`<div style="margin-bottom:1.5rem;"><div style="font-size:.8rem;color:var(--text-muted);margin-bottom:4px;">${completedCount}/${pts.length} routes completed</div><div class="progress-wrap"><div class="progress-fill" style="width:${progressPct}%"></div></div></div>`:''}
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:auto;">
          <button class="btn btn-primary" onclick="openPlaythroughModal('${game.id}')">+ New Route</button>
          <button class="btn btn-ghost" onclick="openNotesModal('${game.id}')">${Icons.fileText} Notes</button>
          <button class="btn btn-ghost" onclick="openEditModal('${game.id}')">${Icons.edit} Edit</button>
          <button class="btn btn-danger" onclick="deleteGame('${game.id}')">${Icons.trash} Delete</button>
        </div>
      </div>
    </div>
    <h3 class="section-heading">Trail Log</h3>
    ${sortBar}
    <div class="trail-log" id="trail-log-container">${logsHTML}</div>`;

  // Wire up the sort dropdown to re-render only the log entries
  window._trailSort = function(mode) {
    const container = document.getElementById('trail-log-container');
    if (!container) return;
    const sorted = sortPts(pts, mode).map(buildLogEntry).join('') || `<p style="color:var(--text-muted)">No routes logged yet. Add your characters!</p>`;
    container.innerHTML = sorted;
  };
}

// ── Route actions ─────────────────────────────────────────
window.toggleFav = function(pid, gid) {
  const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
  p.isFavorite = !p.isFavorite; saveData(); renderView('game-details',gid);
};
window.deletePlaythrough = function(pid, gid) {
  if (!confirm('Delete this route log?')) return;
  appData.playthroughs = appData.playthroughs.filter(p=>p.id!==pid);
  appData.reviews = appData.reviews.filter(r=>r.playthroughId!==pid);
  saveData(); renderView('game-details',gid);
};
window.deleteGame = function(gid) {
  if (!confirm('Delete this game and all its logs?')) return;
  const pids = appData.playthroughs.filter(p=>p.gameId===gid).map(p=>p.id);
  appData.games = appData.games.filter(g=>g.id!==gid);
  appData.playthroughs = appData.playthroughs.filter(p=>p.gameId!==gid);
  appData.reviews = appData.reviews.filter(r=>!pids.includes(r.playthroughId));
  saveData(); renderView('library');
};
window.dropRoute = function(pid, gid) {
  const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
  p.status='Dropped'; p.endDate=new Date().toISOString().split('T')[0]; saveData(); renderView('game-details',gid);
};
window.pauseRoute = function(pid, gid) {
  const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
  p.status='Paused'; saveData(); renderView('game-details',gid);
};
window.startRoute = function(pid, gid) {
  const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
  p.status='Playing'; p.startDate=new Date().toISOString().split('T')[0]; saveData(); renderView('game-details',gid);
};
window.resumeRoute = function(pid, gid) {
  const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
  p.status='Playing'; saveData(); renderView('game-details',gid);
};

// ── Modal helpers ─────────────────────────────────────────
window.closeModal = function() { modalContainer.classList.add('hidden'); };
modalContainer.addEventListener('click', e => { if(e.target===modalContainer) closeModal(); });
function openModal(html) { modalBody.innerHTML = html; modalContainer.classList.remove('hidden'); }

// ── Start route modal ─────────────────────────────────────
window.openPlaythroughModal = function(gid) {
  const today = new Date().toISOString().split('T')[0];
  openModal(`<h3 style="margin-bottom:.5rem;">Add Route / Character</h3>
    <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:1.5rem;">Add a romanceable character or route to track.</p>
    <form id="pt-form">
      <div class="form-group"><label>Route / Character *</label><input type="text" id="pt-route" class="form-control" placeholder="e.g. Zen's Route" required></div>
      <div class="form-group"><label>Character Photo</label>
        <div style="display:flex;gap:.5rem;align-items:center;">
          <input type="url" id="pt-photo" class="form-control" placeholder="Paste URL…" style="flex:1;">
          <label class="btn btn-ghost" style="font-size:.8rem;padding:.6rem .85rem;cursor:pointer;flex-shrink:0;">📁 File<input type="file" accept="image/*" style="display:none;" onchange="routePhotoFromFile(event)"></label>
        </div>
      </div>
      <div class="form-group"><label>Character Notes</label><textarea id="pt-notes" class="form-control" rows="2" placeholder="Describe the character…"></textarea></div>
      <div class="form-group"><label>Start playing now?</label>
        <div class="toggle-row" style="margin-top:.5rem;">
          <span class="toggle-label" style="font-size:.85rem;">Yes, I'm starting this route now</span>
          <label class="toggle-switch"><input type="checkbox" id="pt-start-now" onchange="document.getElementById('pt-start-container').style.display=this.checked?'block':'none'"><span class="toggle-slider"></span></label>
        </div>
      </div>
      <div class="form-group" id="pt-start-container" style="display:none;"><label>Start Date</label><input type="date" id="pt-start" class="form-control" value="${today}"></div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:2;">Add Route</button>
      </div>
    </form>`);
  document.getElementById('pt-form').onsubmit = e => {
    e.preventDefault();
    const startNow = document.getElementById('pt-start-now').checked;
    const startDate = startNow ? document.getElementById('pt-start').value : '';
    appData.playthroughs.push({ id:uid(), gameId:gid,
      route:document.getElementById('pt-route').value,
      characterPhotoUrl:document.getElementById('pt-photo').value,
      characterProfile:document.getElementById('pt-notes').value,
      status: startNow ? 'Playing' : 'Not Started', startDate,
      endDate:'', isFavorite:false });
    saveData(); closeModal(); renderView('game-details',gid);
  };
};

// Route photo from file helper
window.routePhotoFromFile = function(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const input = document.getElementById('pt-photo') || document.getElementById('er-photo');
    if (input) input.value = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// ── Edit Route modal ──────────────────────────────────────
window.openEditRouteModal = function(pid, gid) {
  const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
  openModal(`<h3 style="margin-bottom:1.5rem;">Edit Route</h3>
    <form id="er-form">
      <div class="form-group"><label>Route / Character Name</label><input type="text" id="er-route" class="form-control" value="${p.route||''}" required></div>
      <div class="form-group"><label>Character Photo</label>
        <div style="display:flex;gap:.5rem;align-items:center;">
          <input type="url" id="er-photo" class="form-control" placeholder="Paste URL…" style="flex:1;" value="${p.characterPhotoUrl||''}">
          <label class="btn btn-ghost" style="font-size:.8rem;padding:.6rem .85rem;cursor:pointer;flex-shrink:0;">📁 File<input type="file" accept="image/*" style="display:none;" onchange="routePhotoFromFile(event)"></label>
        </div>
      </div>
      <div class="form-group"><label>Character Notes</label><textarea id="er-notes" class="form-control" rows="3">${p.characterProfile||''}</textarea></div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:2;">${Icons.check} Save</button>
      </div>
    </form>`);
  document.getElementById('er-form').onsubmit = e => {
    e.preventDefault();
    p.route = document.getElementById('er-route').value;
    p.characterPhotoUrl = document.getElementById('er-photo').value;
    p.characterProfile = document.getElementById('er-notes').value;
    saveData(); closeModal(); renderView('game-details',gid);
  };
};

// ── Complete route modal ───────────────────────────────────
window.openCompleteModal = function(pid, gid) {
  const today = new Date().toISOString().split('T')[0];
  openModal(`<h3 style="margin-bottom:.5rem;">Route Completed! 🎉</h3>
    <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:1.5rem;">Log your finish date and leave a quick review.</p>
    <form id="done-form">
      <div class="form-group"><label>Completion Date</label><input type="date" id="done-date" class="form-control" value="${today}" required></div>
      <div class="divider"></div>
      <div class="form-group"><label style="font-size:.82rem;">Rating</label>
        <div class="star-rating">
          ${[5,4,3,2,1].map(n=>`<input type="radio" id="qs${n}" name="qr" value="${n}" onchange="document.getElementById('qs-help').textContent = this.value + ' out of 5 stars'"><label for="qs${n}">★</label>`).join('')}
        </div>
        <div id="qs-help" style="font-size:.75rem; color:var(--text-muted); text-align:right; margin-top:4px;">Optional rating</div>
      </div>
      <div class="form-group"><textarea id="done-text" class="form-control" rows="3" placeholder="Thoughts? (optional)"></textarea></div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-success" style="flex:2;">${Icons.check} Mark Complete</button>
      </div>
    </form>`);
  document.getElementById('done-form').onsubmit = e => {
    e.preventDefault();
    const p = appData.playthroughs.find(p=>p.id===pid); if(!p) return;
    p.status='Completed'; p.endDate=document.getElementById('done-date').value;
    const rated = document.querySelector('input[name="qr"]:checked');
    const text = document.getElementById('done-text').value.trim();
    if (rated||text) appData.reviews.push({ id:uid(), playthroughId:pid, rating:rated?+rated.value:0, content:text, hasSpoilers:false });
    saveData(); closeModal(); renderView('game-details',gid);
  };
};

// ── Full review modal ─────────────────────────────────────
window.openReviewModal = function(pid, gid) {
  const existingRev = appData.reviews.find(r => r.playthroughId === pid);
  openModal(`<h3 style="margin-bottom:1.5rem;">${existingRev ? 'Edit' : 'Write a'} Review</h3>
    <form id="rev-form">
      <div class="form-group"><label>Rating</label>
        <div class="star-rating">
          ${[5,4,3,2,1].map(n=>`<input type="radio" id="s${n}" name="rating" value="${n}" ${existingRev && existingRev.rating===n ? 'checked' : ''} required onchange="document.getElementById('rating-help').textContent = this.value + ' out of 5 stars'"><label for="s${n}">★</label>`).join('')}
        </div>
        <div id="rating-help" style="font-size:.75rem; color:var(--text-muted); text-align:right; margin-top:4px;">${existingRev && existingRev.rating ? existingRev.rating + ' out of 5 stars' : 'Select a rating'}</div>
      </div>
      <div class="form-group"><label>Your Thoughts</label><textarea id="rev-text" class="form-control" rows="4" placeholder="Optional thoughts...">${existingRev ? existingRev.content||'' : ''}</textarea></div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;background:var(--bg-hover);padding:10px;border-radius:8px;">
        <input type="checkbox" id="rev-spoil" style="accent-color:var(--pink);width:16px;height:16px;" ${existingRev && existingRev.hasSpoilers ? 'checked' : ''}>
        <label for="rev-spoil" style="margin:0;cursor:pointer;font-size:.9rem;">Contains spoilers</label>
      </div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:2;">Save Review</button>
      </div>
    </form>`);
  document.getElementById('rev-form').onsubmit = e => {
    e.preventDefault();
    const r = document.querySelector('input[name="rating"]:checked');
    const ratingVal = r ? +r.value : 0;
    const contentVal = document.getElementById('rev-text').value;
    const spoilVal = document.getElementById('rev-spoil').checked;
    
    if (existingRev) {
      existingRev.rating = ratingVal;
      existingRev.content = contentVal;
      existingRev.hasSpoilers = spoilVal;
    } else {
      appData.reviews.push({ id:uid(), playthroughId:pid, rating:ratingVal,
        content:contentVal, hasSpoilers:spoilVal });
    }
    saveData(); closeModal(); renderView('game-details', gid || appData.playthroughs.find(p=>p.id===pid)?.gameId);
  };
};

// ── Edit game modal ───────────────────────────────────────
window.openEditModal = function(gid) {
  const g = appData.games.find(g=>g.id===gid); if(!g) return;
  openModal(`<h3 style="margin-bottom:1.5rem;">Edit Visual Novel</h3>
    <form id="edit-form">
      <div class="form-group"><label>Title *</label><input type="text" id="e-title" class="form-control" value="${g.title||''}" required></div>
      <div class="form-group"><label>Cover URL</label><input type="url" id="e-cover" class="form-control" value="${g.coverUrl||''}"></div>
      <div class="form-group"><label>Developer</label><input type="text" id="e-dev" class="form-control" value="${g.developer||''}"></div>
      <div class="form-group"><label>Platform *</label>
        <input list="e-plats" id="e-platform" class="form-control" value="${g.platform||''}" required>
        <datalist id="e-plats"><option>Steam</option><option>Itch.io</option><option>Nintendo Switch</option><option>PlayStation</option><option>Mobile</option></datalist>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="e-status" class="form-control" onchange="document.getElementById('e-start-date-container').style.display = this.value === 'Want to Play' ? 'none' : 'block'">
          ${['Want to Play','Playing','Completed','Paused','Dropped'].map(s=>`<option${g.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="e-start-date-container" style="display:${g.status === 'Want to Play' || !g.status ? 'none' : 'block'};">
        <label>Date Started</label>
        <input type="date" id="e-start-date" class="form-control" value="${g.startDate || new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group"><label>Tags</label><input type="text" id="e-tags" class="form-control" value="${(g.tags||[]).join(', ')}"></div>
      <div class="form-group"><label>Synopsis</label><textarea id="e-desc" class="form-control" rows="3">${g.description||''}</textarea></div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:2;">${Icons.check} Save</button>
      </div>
    </form>`);
  setupTagAutocomplete('e-tags');
  document.getElementById('edit-form').onsubmit = e => {
    e.preventDefault();
    g.title = document.getElementById('e-title').value;
    g.coverUrl = document.getElementById('e-cover').value;
    g.developer = document.getElementById('e-dev').value;
    g.platform = document.getElementById('e-platform').value;
    g.status = document.getElementById('e-status').value;
    g.startDate = g.status !== 'Want to Play' ? document.getElementById('e-start-date').value : '';
    g.tags = document.getElementById('e-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
    g.description = document.getElementById('e-desc').value;
    saveData(); closeModal(); renderView('game-details',gid);
  };
};

// ── Notes modal ───────────────────────────────────────────
window.openNotesModal = function(gid) {
  const g = appData.games.find(g=>g.id===gid); if(!g) return;
  openModal(`
    <h3 style="margin-bottom:1rem;display:flex;align-items:center;gap:8px;">${Icons.fileText} Personal Notes & Tips</h3>
    <div style="border:1px solid var(--border-color); border-radius:8px; overflow:hidden;">
      <div style="background:var(--bg-hover); padding:8px; display:flex; gap:8px; border-bottom:1px solid var(--border-color); flex-wrap:wrap;">
        <button type="button" class="btn btn-ghost" style="padding:4px 8px;font-weight:bold;min-width:32px;" onmousedown="event.preventDefault(); document.execCommand('bold',false,null)" title="Bold">B</button>
        <button type="button" class="btn btn-ghost" style="padding:4px 8px;font-style:italic;min-width:32px;" onmousedown="event.preventDefault(); document.execCommand('italic',false,null)" title="Italic">I</button>
        <button type="button" class="btn btn-ghost" style="padding:4px 8px;text-decoration:underline;min-width:32px;" onmousedown="event.preventDefault(); document.execCommand('underline',false,null)" title="Underline">U</button>
        <div style="width:1px; background:var(--border-color); margin:0 4px;"></div>
        <button type="button" class="btn btn-ghost" style="padding:4px 8px;" onmousedown="event.preventDefault(); document.execCommand('insertUnorderedList',false,null)" title="Bullet List">• List</button>
        <button type="button" class="btn btn-ghost" style="padding:4px 8px;" onmousedown="event.preventDefault(); document.execCommand('insertOrderedList',false,null)" title="Numbered List">1. List</button>
      </div>
      <div id="rich-notes-editor" contenteditable="true" style="min-height:200px; max-height:400px; overflow-y:auto; padding:12px; font-size:.95rem; color:var(--text-body); outline:none; line-height:1.6;">${g.notes || '<p><br></p>'}</div>
    </div>
    <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
      <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" style="flex:2;" onclick="saveNotes('${gid}')">${Icons.check} Save Notes</button>
    </div>
  `);
};
window.saveNotes = function(gid) {
  const g = appData.games.find(g=>g.id===gid); if(!g) return;
  g.notes = document.getElementById('rich-notes-editor').innerHTML;
  saveData(); closeModal(); renderView('game-details',gid);
};

// ── Profile / Settings modal ──────────────────────────────
document.querySelector('.avatar').addEventListener('click', () => {
  const s = appData.settings;
  const total = appData.games.length;
  const done  = appData.playthroughs.filter(p=>p.status==='Completed').length;
  const favs  = appData.playthroughs.filter(p=>p.isFavorite).length;
  const avStyle = s.avatarUrl ? `background-image:url('${s.avatarUrl}');` : '';
  openModal(`
    <div style="text-align:center;margin-bottom:1.5rem;">
      <div class="profile-avatar-edit" id="profile-avatar" style="${avStyle}" title="Click to change photo">
        <input type="file" id="avatar-file" accept="image/*" style="display:none;">
      </div>
      <h2 style="margin-bottom:.25rem;">My Profile</h2>
      <input type="text" id="profile-tagline" class="form-control" style="text-align:center;max-width:240px;margin:0 auto;padding:.5rem .75rem;font-size:.85rem;" value="${s.tagline||'VN Enthusiast'}" placeholder="Your tagline…">
    </div>
    <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:1.5rem;">
      <div style="text-align:center;"><div style="font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:var(--accent-primary);">${total}</div><div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Games</div></div>
      <div style="text-align:center;"><div style="font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:var(--accent-primary);">${done}</div><div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Completed</div></div>
      <div style="text-align:center;"><div style="font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:var(--accent-primary);">${favs}</div><div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Favorites</div></div>
    </div>
    <div class="divider"></div>
    <h4 style="margin-bottom:1rem;font-size:.95rem;">Settings</h4>
    <div class="form-group">
      <label>Custom Background URL</label>
      <input type="url" id="bg-url" class="form-control" placeholder="Leave blank for default…" value="${s.backgroundUrl||''}">
    </div>
    <div class="divider"></div>
    <h4 style="margin-bottom:1rem;font-size:.95rem;">Data</h4>
    <div style="display:flex;gap:.75rem;">
      <button class="btn btn-ghost" style="flex:1;" onclick="exportData()">${Icons.download} Export</button>
      <label class="btn btn-ghost" style="flex:1;cursor:pointer;">${Icons.upload} Import<input type="file" id="import-file" accept=".json" style="display:none;" onchange="importData(event)"></label>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:1.25rem;" id="save-settings-btn">Save & Close</button>`);

  // Avatar click to upload
  document.getElementById('profile-avatar').addEventListener('click', () => {
    document.getElementById('avatar-file').click();
  });
  document.getElementById('avatar-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      document.getElementById('profile-avatar').style.backgroundImage = `url('${url}')`;
      appData.settings.avatarUrl = url;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('save-settings-btn').onclick = () => {
    appData.settings.backgroundUrl = document.getElementById('bg-url').value;
    appData.settings.tagline = document.getElementById('profile-tagline').value || 'VN Enthusiast';
    saveData(); closeModal();
  };
});

// ── Export / Import ───────────────────────────────────────
window.exportData = function() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vn-library-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
window.importData = function(e) {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported || !imported.games) {
        openModal('<div style="text-align:center;padding:2rem;"><h3>Invalid Backup</h3><p style="color:var(--text-muted);margin-top:.5rem;">Missing games data.</p><button class="btn btn-primary" style="margin-top:1.5rem;" onclick="closeModal()">Close</button></div>');
        return;
      }
      openModal(`
        <div style="text-align:center;padding:1.5rem .5rem;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">⚠️</div>
          <h3 style="color:var(--pink);margin-bottom:.5rem;">Replace Library?</h3>
          <p style="color:var(--text-muted);font-size:.9rem;">This will overwrite your current library with the imported data. Are you sure you want to continue?</p>
          <div style="display:flex;gap:1rem;margin-top:2rem;">
            <button class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" style="flex:1;background:var(--pink);" id="confirm-import-btn">Yes, Import</button>
          </div>
        </div>
      `);
      document.getElementById('confirm-import-btn').onclick = () => {
        // Merge with defaults to ensure no missing keys crash the app
        appData = {
          games: imported.games || [],
          playthroughs: imported.playthroughs || [],
          reviews: imported.reviews || [],
          settings: { ...defaults.settings, ...(imported.settings || {}) }
        };
        saveData(); 
        closeModal(); 
        renderView('dashboard');
      };
    } catch (err) { 
      console.error('Import error:', err);
      openModal('<div style="text-align:center;padding:2rem;"><h3>Import Error</h3><p style="color:var(--text-muted);margin-top:.5rem;">Failed to parse backup file. Ensure it is a valid JSON.</p><button class="btn btn-primary" style="margin-top:1.5rem;" onclick="closeModal()">Close</button></div>');
    }
  };
  reader.readAsText(file);
};

// ── Image Cropper ─────────────────────────────────────────
window.openCropper = function(imgUrl, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'cropper-overlay';
  overlay.innerHTML = `
    <p class="cropper-hint">Click and drag to select the crop area, then click "Crop"</p>
    <div class="cropper-canvas-wrap"><canvas id="crop-canvas"></canvas></div>
    <div class="cropper-toolbar">
      <button class="btn btn-ghost" id="crop-cancel" style="color:#fff;border-color:rgba(255,255,255,.3);">Cancel</button>
      <button class="btn btn-primary" id="crop-apply">Crop & Apply</button>
    </div>`;
  document.body.appendChild(overlay);

  const canvas = document.getElementById('crop-canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  // Only set crossOrigin for non-data URLs (data URLs don't need it)
  if (!imgUrl.startsWith('data:')) img.crossOrigin = 'anonymous';
  let sel = { x1:0, y1:0, x2:0, y2:0, dragging:false };
  let scale = 1;

  img.onload = () => {
    const maxW = Math.min(window.innerWidth * 0.85, 700);
    const maxH = window.innerHeight * 0.6;
    scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    drawCanvas();
  };
  img.onerror = () => {
    // If crossOrigin failed, retry without it (image will show but crop may be limited)
    if (img.crossOrigin !== null) {
      img.crossOrigin = null;
      img.src = imgUrl;
      return;
    }
    alert('Could not load image. Try uploading via the 📁 File button instead.');
    overlay.remove();
  };
  img.src = imgUrl;

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (sel.x1 !== sel.x2 || sel.y1 !== sel.y2) {
      // Dim outside selection
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const sx = Math.min(sel.x1, sel.x2), sy = Math.min(sel.y1, sel.y2);
      const sw = Math.abs(sel.x2 - sel.x1), sh = Math.abs(sel.y2 - sel.y1);
      ctx.clearRect(sx, sy, sw, sh);
      ctx.drawImage(img, sx/scale, sy/scale, sw/scale, sh/scale, sx, sy, sw, sh);
      ctx.strokeStyle = '#ff8fa3';
      ctx.lineWidth = 2;
      ctx.setLineDash([6,3]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
    }
  }

  canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    sel.x1 = e.clientX - r.left; sel.y1 = e.clientY - r.top;
    sel.x2 = sel.x1; sel.y2 = sel.y1;
    sel.dragging = true;
  });
  canvas.addEventListener('mousemove', e => {
    if (!sel.dragging) return;
    const r = canvas.getBoundingClientRect();
    sel.x2 = Math.max(0, Math.min(canvas.width, e.clientX - r.left));
    sel.y2 = Math.max(0, Math.min(canvas.height, e.clientY - r.top));
    drawCanvas();
  });
  canvas.addEventListener('mouseup', () => { sel.dragging = false; });

  document.getElementById('crop-cancel').onclick = () => overlay.remove();
  document.getElementById('crop-apply').onclick = () => {
    const sx = Math.min(sel.x1, sel.x2)/scale, sy = Math.min(sel.y1, sel.y2)/scale;
    const sw = Math.abs(sel.x2 - sel.x1)/scale, sh = Math.abs(sel.y2 - sel.y1)/scale;
    if (sw < 10 || sh < 10) { alert('Please select a larger area.'); return; }
    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    out.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    try {
      const dataUrl = out.toDataURL('image/jpeg', 0.9);
      callback(dataUrl);
      overlay.remove();
    } catch(e) {
      alert('This external image can\'t be cropped due to browser security restrictions.\n\nTip: Use the 📁 File button to upload the image from your computer first, then crop it.');
    }
  };
};

// ── Analytics ─────────────────────────────────────────────
let analyticsFilter = { period: 'all', platform: 'All', tag: 'All' };

function renderAnalytics() {
  const platforms = ['All', ...new Set(appData.games.map(g=>g.platform).filter(Boolean))];
  const allTags = ['All', ...getAllTags()];

  viewContainer.innerHTML = `
    <div class="analytics-filter-bar">
      <select id="an-period" class="filter-input">
        <option value="all" ${analyticsFilter.period==='all'?'selected':''}>All Time</option>
        <option value="30" ${analyticsFilter.period==='30'?'selected':''}>Last 30 Days</option>
        <option value="90" ${analyticsFilter.period==='90'?'selected':''}>Last 90 Days</option>
        <option value="365" ${analyticsFilter.period==='365'?'selected':''}>This Year</option>
      </select>
      <select id="an-platform" class="filter-input">
        ${platforms.map(p=>`<option value="${p}" ${analyticsFilter.platform===p?'selected':''}>${p === 'All' ? 'All Platforms' : p}</option>`).join('')}
      </select>
      <select id="an-tag" class="filter-input">
        ${allTags.map(t=>`<option value="${t}" ${analyticsFilter.tag===t?'selected':''}>${t === 'All' ? 'All Tags' : t}</option>`).join('')}
      </select>
    </div>
    <div id="analytics-content"></div>`;

  document.getElementById('an-period').onchange = e => { analyticsFilter.period = e.target.value; drawAnalytics(); };
  document.getElementById('an-platform').onchange = e => { analyticsFilter.platform = e.target.value; drawAnalytics(); };
  document.getElementById('an-tag').onchange = e => { analyticsFilter.tag = e.target.value; drawAnalytics(); };
  drawAnalytics();
}

function drawAnalytics() {
  const container = document.getElementById('analytics-content');
  if (!container) return;

  // Apply filters
  let games = [...appData.games];
  if (analyticsFilter.platform !== 'All') games = games.filter(g => g.platform === analyticsFilter.platform);
  if (analyticsFilter.tag !== 'All') games = games.filter(g => (g.tags||[]).includes(analyticsFilter.tag));

  const gameIds = new Set(games.map(g => g.id));
  let pts = appData.playthroughs.filter(p => gameIds.has(p.gameId));
  const ptIds = new Set(pts.map(p => p.id));
  let revs = appData.reviews.filter(r => ptIds.has(r.playthroughId));

  // Time filter on playthroughs
  if (analyticsFilter.period !== 'all') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(analyticsFilter.period));
    const cutoffStr = cutoff.toISOString().split('T')[0];
    pts = pts.filter(p => (p.endDate || p.startDate || '') >= cutoffStr);
    const filteredPtIds = new Set(pts.map(p => p.id));
    revs = revs.filter(r => filteredPtIds.has(r.playthroughId));
  }

  // Overview stats
  const totalRoutes = pts.length;
  const completedRoutes = pts.filter(p => p.status === 'Completed').length;
  const favRoutes = pts.filter(p => p.isFavorite).length;
  const avgRating = revs.length ? (revs.reduce((s,r) => s + r.rating, 0) / revs.length).toFixed(1) : '—';

  // Tag distribution
  const tagCounts = {};
  games.forEach(g => (g.tags||[]).forEach(t => { tagCounts[t] = (tagCounts[t]||0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const tagMax = topTags.length ? Math.max(...topTags.map(t => t[1])) : 1;

  // Platform distribution
  const platCounts = {};
  games.forEach(g => { const p = g.platform || 'Unknown'; platCounts[p] = (platCounts[p]||0) + 1; });
  const platformData = Object.entries(platCounts).sort((a,b) => b[1] - a[1]);
  const platMax = platformData.length ? Math.max(...platformData.map(p => p[1])) : 1;

  // Status distribution
  const statusCounts = { 'Want to Play':0, 'Playing':0, 'Completed':0, 'Paused':0, 'Dropped':0 };
  games.forEach(g => { const s = g.status || 'Want to Play'; statusCounts[s] = (statusCounts[s]||0) + 1; });
  const statusTotal = games.length || 1;
  const statusColors = { 'Want to Play':'#b39ddb', 'Playing':'#64b5f6', 'Completed':'#81c784', 'Paused':'#ffb74d', 'Dropped':'#ef9a9a' };

  // Rating distribution
  const ratingCounts = {1:0, 2:0, 3:0, 4:0, 5:0};
  revs.forEach(r => { if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating]++; });
  const ratingMax = Math.max(...Object.values(ratingCounts), 1);

  // Completion time
  const completedPts = pts.filter(p => p.status === 'Completed' && p.startDate && p.endDate);
  let avgDays = 0, fastestDays = Infinity, slowestDays = 0;
  if (completedPts.length) {
    const daysArr = completedPts.map(p => Math.ceil(Math.abs(new Date(p.endDate) - new Date(p.startDate)) / 86400000));
    avgDays = Math.round(daysArr.reduce((a,b) => a + b, 0) / daysArr.length);
    fastestDays = Math.min(...daysArr);
    slowestDays = Math.max(...daysArr);
  }

  // Most productive month
  const monthCounts = {};
  completedPts.forEach(p => { const m = p.endDate.substring(0,7); monthCounts[m] = (monthCounts[m]||0) + 1; });
  const topMonth = Object.entries(monthCounts).sort((a,b) => b[1] - a[1])[0];
  const topMonthLabel = topMonth ? new Date(topMonth[0]+'-01').toLocaleDateString('en-US',{month:'long',year:'numeric'}) + ` (${topMonth[1]})` : '—';

  // Top rated games
  const gameRatings = games.map(g => {
    const gPts = appData.playthroughs.filter(p => p.gameId === g.id);
    const gRevs = appData.reviews.filter(r => gPts.some(p => p.id === r.playthroughId) && r.rating > 0);
    const avg = gRevs.length ? gRevs.reduce((s,r) => s + r.rating, 0) / gRevs.length : 0;
    return { game: g, avg, reviewCount: gRevs.length };
  }).filter(x => x.reviewCount > 0).sort((a,b) => b.avg - a.avg).slice(0, 5);

  // Helper: horizontal bar
  function hBar(data, max, colorFn) {
    if (!data.length) return '<p class="an-empty">No data yet.</p>';
    return data.map(([label, count], i) => {
      const pct = max > 0 ? Math.max(2, (count / max) * 100) : 2;
      const color = colorFn ? colorFn(label, i) : '';
      const style = color ? `background:${color};` : '';
      return `<div class="hbar-row">
        <span class="hbar-label" title="${label}">${label}</span>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pct}%;${style}"></div>
        </div>
        <span class="hbar-count">${count}</span>
      </div>`;
    }).join('');
  }

  // Status donut segments
  const statusEntries = Object.entries(statusCounts).filter(([,c]) => c > 0);
  const statusSegments = statusEntries.map(([label, count]) => {
    const pct = Math.round((count / statusTotal) * 100);
    return `<div class="status-segment" style="margin-bottom:.5rem;">
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
        <span class="status-segment-label" style="font-weight:600; color:var(--text-secondary);">${label}</span>
        <span class="status-segment-value">${count} <small style="opacity:.6;">(${pct}%)</small></span>
      </div>
      <div class="status-segment-bar" style="background:${statusColors[label]}; width:${Math.max(pct, 4)}%; height:8px; border-radius:4px;"></div>
    </div>`;
  }).join('');

  // Most played developer
  const devCounts = {};
  games.forEach(g => { if(g.developer) devCounts[g.developer] = (devCounts[g.developer]||0) + 1; });
  const topDev = Object.entries(devCounts).sort((a,b)=>b[1]-a[1])[0] || ['Unknown','0'];

  container.innerHTML = `
    <div class="an-hero">
      <div class="an-hero-main">
        <span class="an-hero-title">Visual Novel Journey</span>
        <div class="an-hero-val">${games.length}</div>
        <span class="an-hero-stat-label">Total Titles Tracked</span>
      </div>
      <div class="an-hero-stats">
        <div class="an-hero-stat">
          <span class="an-hero-stat-val">${completedRoutes}</span>
          <span class="an-hero-stat-label">Completed Routes</span>
        </div>
        <div class="an-hero-stat">
          <span class="an-hero-stat-val" style="color:var(--accent-primary);">${avgRating} ★</span>
          <span class="an-hero-stat-label">Average Rating</span>
        </div>
      </div>
    </div>

    <div class="an-stats-grid">
      <div class="an-card-stat" title="Total number of routes/playthroughs across all games in your library.">
        <span class="an-card-stat-label">Total Routes ⓘ</span>
        <div class="an-card-stat-val">${totalRoutes}</div>
      </div>
      <div class="an-card-stat" style="border-left-color: #81c784;" title="Percentage of routes that have been marked as 'Completed'. (Completed / Total)">
        <span class="an-card-stat-label">Completion Rate ⓘ</span>
        <div class="an-card-stat-val">${Math.round((completedRoutes/Math.max(totalRoutes,1))*100)}%</div>
      </div>
      <div class="an-card-stat" style="border-left-color: #ffd700;" title="Number of routes you have marked as a favorite.">
        <span class="an-card-stat-label">Favorite Routes ⓘ</span>
        <div class="an-card-stat-val">${favRoutes}</div>
      </div>
      <div class="an-card-stat" style="border-left-color: #74c0fc;" title="Total number of reviews written for your playthroughs.">
        <span class="an-card-stat-label">Total Reviews ⓘ</span>
        <div class="an-card-stat-val">${revs.length}</div>
      </div>
    </div>

    <div class="an-bento">
      <div class="an-card" style="grid-row: span 2;">
        <h4>🏆 Top Rated Titles</h4>
        ${gameRatings.length ? `<div class="top-rated-list">${gameRatings.map((x, i) => `
          <div class="top-rated-item" onclick="renderView('game-details','${x.game.id}')">
            <span class="top-rated-rank">#${i+1}</span>
            <img class="top-rated-cover" src="${x.game.coverUrl || 'https://via.placeholder.com/40x55?text=?'}" alt="${x.game.title}">
            <div class="top-rated-info">
              <span class="top-rated-title">${x.game.title}</span>
              <span class="top-rated-meta">${x.game.developer || 'Unknown Dev'} · ${x.avg.toFixed(1)} ★</span>
            </div>
            <div style="text-align:right;">
               <div style="color:var(--accent-primary); font-weight:700;">${'★'.repeat(Math.round(x.avg))}</div>
               <span class="top-rated-reviews">${x.reviewCount} route${x.reviewCount !== 1 ? 's' : ''} rated</span>
            </div>
          </div>`).join('')}</div>` : '<p class="an-empty">Rate some routes to see your top games!</p>'}
      </div>

      <div class="an-card">
        <h4>📋 Status Breakdown</h4>
        <div class="status-segments">${statusSegments || '<p class="an-empty">No games yet.</p>'}</div>
      </div>

      <div class="an-card">
        <h4>⏱️ Completion Velocity</h4>
        <div class="an-kv"><span>Avg Time / Route</span><strong>${completedPts.length ? avgDays + ' days' : '—'}</strong></div>
        <div class="an-kv"><span>Fastest Completion</span><strong>${fastestDays !== Infinity ? fastestDays + ' days' : '—'}</strong></div>
        <div class="an-kv"><span>Top Developer</span><strong style="color:var(--accent-primary);">${topDev[0]} (${topDev[1]})</strong></div>
        <div class="an-kv"><span>Prime Month</span><strong style="font-size:.85rem; color:var(--accent-primary);">${topMonthLabel}</strong></div>
      </div>

      <div class="an-card">
        <h4>🏷️ Popular Tags</h4>
        ${hBar(topTags, tagMax)}
      </div>

      <div class="an-card">
        <h4>🎮 Platform Distribution</h4>
        ${hBar(platformData, platMax)}
      </div>

      <div class="an-card">
        <h4>⭐ Rating Distribution</h4>
        ${hBar([5,4,3,2,1].map(n => [n + ' ★', ratingCounts[n]]), ratingMax, (label, i) => {
          const colors = ['#ff8fa3','#ffb3c6','#ffccd5','#fce4ec','#f8bbd0'];
          return colors[i] || '';
        })}
      </div>
    </div>`;
}

// ── Falling leaves ────────────────────────────────────────
(function createLeaves() {
  const wrap = document.createElement('div');
  wrap.className = 'leaves-container';
  document.body.prepend(wrap);
  ['🍁','🍂','🍃'].forEach((em,i) => {
    for (let j=0; j<10; j++) {
      const l = document.createElement('div');
      l.className='leaf'; l.textContent=em;
      l.style.left = Math.random()*100+'vw';
      l.style.animationDuration = (Math.random()*8+7)+'s';
      l.style.animationDelay = (Math.random()*12)+'s';
      l.style.fontSize = (Math.random()*10+13)+'px';
      wrap.appendChild(l);
    }
  });
})();

// ── Init ──────────────────────────────────────────────────
renderView('dashboard');
applySettings(); // re-apply to set avatar after DOM is ready
