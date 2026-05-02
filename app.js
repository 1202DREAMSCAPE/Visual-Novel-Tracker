// ── State ─────────────────────────────────────────────────
const STORAGE_KEY = 'vnTrackerData';
const defaults = { games:[], playthroughs:[], reviews:[], settings:{ theme:'light', backgroundUrl:'' } };

const Icons = {
  check:`<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  edit:`<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  heart:`<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  drop:`<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  download:`<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload:`<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`
};

function loadData() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (!d) return JSON.parse(JSON.stringify(defaults));
    const p = JSON.parse(d);
    if (!p.settings) p.settings = { theme:'light', backgroundUrl:'' };
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
  document.body.setAttribute('data-theme', s.theme === 'dark' ? 'dark' : '');
  if (s.backgroundUrl) {
    document.body.style.backgroundImage = `url('${s.backgroundUrl}')`;
    document.body.classList.add('has-custom-bg');
  } else {
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-custom-bg');
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
  viewContainer.innerHTML = '';
  viewContainer.style.animation = 'none';
  requestAnimationFrame(() => { viewContainer.style.animation = ''; });
  const titles = { dashboard:'Dashboard', library:'My Library', 'add-game':'Add Visual Novel' };
  pageTitle.textContent = titles[view] || '';
  if (view === 'dashboard') renderDashboard();
  else if (view === 'library') renderLibrary();
  else if (view === 'add-game') renderAddGame();
  else if (view === 'game-details') {
    const g = appData.games.find(g => g.id === param);
    if (g) { pageTitle.textContent = g.title; renderGameDetails(g); }
    else renderView('library');
  }
}

// ── Helpers ───────────────────────────────────────────────
function statusBadge(s) {
  const cls = { Playing:'status-playing', Completed:'status-completed', Dropped:'status-dropped', Paused:'status-paused' }[s] || 'status-playing';
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

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const total = appData.games.length;
  const done  = appData.playthroughs.filter(p => p.status==='Completed').length;
  const favs  = appData.playthroughs.filter(p => p.isFavorite);
  const playing = appData.playthroughs.filter(p => p.status==='Playing').length;

  const recent = appData.playthroughs.slice().reverse().slice(0,5).map(p => {
    const g = appData.games.find(g => g.id===p.gameId);
    if (!g) return '';
    return `<div class="log-entry${p.isFavorite?' is-favorite':''}" onclick="renderView('game-details','${g.id}')" style="cursor:pointer;padding:1rem;margin-bottom:.75rem;">
      <div class="log-header">
        <span class="route-name" style="font-size:1rem;">${g.title} — ${p.route}</span>
        ${statusBadge(p.status)}
      </div>
    </div>`;
  }).join('') || `<p style="color:var(--text-muted)">No activity yet.</p>`;

  const favCards = favs.map(p => {
    const g = appData.games.find(g => g.id===p.gameId);
    if (!g) return '';
    const img = p.characterPhotoUrl || g.coverUrl || 'https://via.placeholder.com/50';
    return `<div class="log-entry" onclick="renderView('game-details','${g.id}')" title="${g.title} — ${p.route}" style="cursor:pointer;padding:.85rem;margin-bottom:.75rem;display:flex;align-items:center;gap:12px;">
      <img src="${img}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--pink);flex-shrink:0;">
      <div><div style="font-family:'Cormorant Garamond',serif;font-weight:700;color:var(--text-h);">${g.title}</div>
      <div style="font-size:.8rem;color:var(--text-muted);">${p.route}</div></div>
    </div>`;
  }).join('') || `<p style="color:var(--text-muted)">No favorites yet.</p>`;

  viewContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-title">Total VNs</span><span class="stat-value">${total}</span></div>
      <div class="stat-card"><span class="stat-title">Currently Playing</span><span class="stat-value">${playing}</span></div>
      <div class="stat-card"><span class="stat-title">Routes Completed</span><span class="stat-value">${done}</span></div>
      <div class="stat-card"><span class="stat-title">Fav Routes</span><span class="stat-value">${favs.length}</span></div>
    </div>
    <div style="display:flex;gap:2rem;">
      <div style="flex:2;">
        <h3 class="section-heading">Recent Activity</h3>
        <div class="trail-log">${recent}</div>
      </div>
      <div style="flex:1;">
        <h3 class="section-heading">Favorite Routes</h3>
        ${favCards}
      </div>
    </div>`;
}

// ── Library ───────────────────────────────────────────────
let libSearch = '', libPlatform = 'All', libStatus = 'All';

function renderLibrary() {
  const platforms = [...new Set(appData.games.map(g=>g.platform).filter(Boolean))];
  viewContainer.innerHTML = `
    <div class="filter-bar">
      <input type="text" id="lib-search" class="filter-input" style="flex:2;" placeholder="Search title, dev, tag…" value="${libSearch}">
      <select id="lib-platform" class="filter-input"><option value="All">All Platforms</option>${platforms.map(p=>`<option ${libPlatform===p?'selected':''}>${p}</option>`).join('')}</select>
      <select id="lib-status" class="filter-input">
        ${['All','Want to Play','Playing','Completed','Dropped','Paused'].map(s=>`<option value="${s}" ${libStatus===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div id="lib-grid"></div>`;
  document.getElementById('lib-search').oninput = e => { libSearch = e.target.value.toLowerCase(); drawGrid(); };
  document.getElementById('lib-platform').onchange = e => { libPlatform = e.target.value; drawGrid(); };
  document.getElementById('lib-status').onchange = e => { libStatus = e.target.value; drawGrid(); };
  drawGrid();
}

function drawGrid() {
  const el = document.getElementById('lib-grid');
  if (!el) return;
  if (!appData.games.length) {
    el.innerHTML = `<div class="empty-state"><h3>Your library is empty!</h3><p>Add your first visual novel to get started.</p><button class="btn btn-primary" onclick="renderView('add-game')">Add a VN</button></div>`;
    return;
  }
  let games = appData.games;
  if (libPlatform !== 'All') games = games.filter(g => g.platform === libPlatform);
  if (libStatus !== 'All') games = games.filter(g => (g.status||'Want to Play') === libStatus);
  if (libSearch) games = games.filter(g =>
    g.title.toLowerCase().includes(libSearch) ||
    (g.developer||'').toLowerCase().includes(libSearch) ||
    (g.tags||[]).some(t => t.toLowerCase().includes(libSearch)));
  if (!games.length) { el.innerHTML = `<p style="color:var(--text-muted);padding:2rem 0;">No games match your filters.</p>`; return; }
  el.innerHTML = `<div class="library-grid">${games.map(g => `
    <div class="game-card" onclick="renderView('game-details','${g.id}')">
      <img class="game-cover" src="${g.coverUrl||'https://via.placeholder.com/300x400?text=No+Cover'}" alt="${g.title}">
      <div class="game-info">
        <div class="game-title">${g.title}</div>
        ${g.developer ? `<span class="game-dev">${g.developer}</span>` : ''}
        <span class="game-platform">${g.platform||'—'}</span>
        <div style="margin-top:5px;">${tagsHTML(g.tags)}</div>
      </div>
    </div>`).join('')}</div>`;
}

// ── Add Game ──────────────────────────────────────────────
function renderAddGame() {
  viewContainer.innerHTML = `
    <div style="display:flex;gap:2.5rem;max-width:860px;margin:0 auto;">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding-top:1rem;">
        <img id="cover-prev" src="https://via.placeholder.com/240x340?text=Cover" style="width:200px;height:290px;object-fit:cover;border-radius:16px;margin-bottom:1.25rem;box-shadow:var(--shadow-m);">
        <div class="form-group" style="width:100%;margin-bottom:0;">
          <label>Cover Image URL</label>
          <input type="url" id="g-cover" class="form-control" placeholder="Paste URL…" oninput="document.getElementById('cover-prev').src=this.value||'https://via.placeholder.com/240x340?text=Cover'" style="text-align:center;">
        </div>
      </div>
      <div class="glass-panel" style="flex:1.5;padding:2rem;">
        <form id="add-form">
          <div class="form-group"><label>Title *</label><input type="text" id="g-title" class="form-control" placeholder="e.g. Clannad, Our Life…" required></div>
          <div class="form-group"><label>Developer</label><input type="text" id="g-dev" class="form-control" placeholder="e.g. Cheritz, Key…"></div>
          <div class="form-group">
            <label>Platform *</label>
            <input list="plat-list" id="g-platform" class="form-control" placeholder="Steam, Itch.io, Yuzu…" required>
            <datalist id="plat-list"><option>Steam</option><option>Itch.io</option><option>Nintendo Switch</option><option>PlayStation</option><option>Mobile</option></datalist>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="g-status" class="form-control">
              <option>Want to Play</option><option>Playing</option><option>Completed</option><option>Paused</option><option>Dropped</option>
            </select>
          </div>
          <div class="form-group"><label>Tags (comma separated)</label><input type="text" id="g-tags" class="form-control" placeholder="Otome, Sci-Fi, Romance…"></div>
          <div class="form-group"><label>Synopsis</label><textarea id="g-desc" class="form-control" rows="3" placeholder="What is this VN about?"></textarea></div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:.5rem;">${Icons.check} Add to Library</button>
        </form>
      </div>
    </div>`;
  document.getElementById('add-form').onsubmit = e => {
    e.preventDefault();
    const tags = document.getElementById('g-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
    appData.games.push({ id:uid(), title:document.getElementById('g-title').value,
      developer:document.getElementById('g-dev').value, coverUrl:document.getElementById('g-cover').value,
      platform:document.getElementById('g-platform').value, status:document.getElementById('g-status').value,
      tags, description:document.getElementById('g-desc').value });
    saveData(); renderView('library');
  };
}

// ── Game Details ──────────────────────────────────────────
function renderGameDetails(game) {
  const pts = appData.playthroughs.filter(p => p.gameId === game.id);
  const completedCount = pts.filter(p=>p.status==='Completed').length;
  const progressPct = pts.length ? Math.round((completedCount/pts.length)*100) : 0;

  const logsHTML = pts.slice().reverse().map(p => {
    const rev = appData.reviews.find(r => r.playthroughId===p.id);
    const stars = rev ? '★'.repeat(rev.rating)+'☆'.repeat(5-rev.rating) : '';
    const reviewBlock = rev ? `<div class="review-text">
      <div class="review-stars">${stars}</div>
      <span class="${rev.hasSpoilers?'spoiler-text':''}" onclick="this.classList.toggle('revealed')">${rev.content||'No text.'}</span>
      ${rev.hasSpoilers?'<small style="display:block;color:var(--pink);margin-top:4px;">Spoiler — click to reveal</small>':''}
    </div>` : '';

    const charBlock = (p.characterPhotoUrl||p.characterProfile) ? `
      <div class="character-profile-container">
        ${p.characterPhotoUrl?`<img class="character-photo" src="${p.characterPhotoUrl}" alt="Character">` : ''}
        ${p.characterProfile?`<div class="character-notes">${p.characterProfile}</div>` : ''}
      </div>` : '';

    const actions = p.status==='Playing' ? `<div style="display:flex;gap:8px;margin-top:1rem;">
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

    return `<div class="log-entry${p.isFavorite?' is-favorite':''}">
      <button onclick="deletePlaythrough('${p.id}','${game.id}')" title="Delete" style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:var(--text-muted);width:20px;height:20px;">${Icons.trash}</button>
      <div class="log-header">
        <span class="route-name">${p.route}</span>
        <button class="favorite-btn${p.isFavorite?' active':''}" onclick="toggleFav('${p.id}','${game.id}')" title="Favorite">${Icons.heart}</button>
        ${statusBadge(p.status)}
      </div>
      <div style="font-size:.82rem;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap;">
        <span>Started: ${p.startDate}</span>
        ${p.endDate?`<span>Ended: ${p.endDate}</span>`:''}
        ${elapsed?`<span style="color:var(--pink);font-weight:600;">${elapsed}</span>`:''}
      </div>
      ${charBlock}${reviewBlock}${actions}
    </div>`;
  }).join('') || `<p style="color:var(--text-muted)">No routes logged yet. Start playing!</p>`;

  viewContainer.innerHTML = `
    <div class="game-details-header">
      <img class="game-details-cover" src="${game.coverUrl||'https://via.placeholder.com/200x290'}" alt="${game.title}">
      <div class="game-details-info">
        <h2 class="game-details-title">${game.title}</h2>
        ${game.developer?`<div class="game-dev" style="font-size:.95rem;margin-bottom:.5rem;">${game.developer}</div>`:''}
        <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:.75rem;">Platform: <strong style="color:var(--text-body);">${game.platform||'—'}</strong></p>
        ${tagsHTML(game.tags, true) ? `<div style="margin-bottom:1rem;">${tagsHTML(game.tags,true)}</div>` : ''}
        ${game.description?`<p class="description-block">${game.description}</p>`:''}
        ${pts.length?`<div style="margin-bottom:1.5rem;"><div style="font-size:.8rem;color:var(--text-muted);margin-bottom:4px;">${completedCount}/${pts.length} routes completed</div><div class="progress-wrap"><div class="progress-fill" style="width:${progressPct}%"></div></div></div>`:''}
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:auto;">
          <button class="btn btn-primary" onclick="openPlaythroughModal('${game.id}')">+ New Route</button>
          <button class="btn btn-ghost" onclick="openEditModal('${game.id}')">${Icons.edit} Edit</button>
          <button class="btn btn-danger" onclick="deleteGame('${game.id}')">${Icons.trash} Delete</button>
        </div>
      </div>
    </div>
    <h3 class="section-heading">Trail Log</h3>
    <div class="trail-log">${logsHTML}</div>`;
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
  openModal(`<h3 style="margin-bottom:.5rem;">Start New Route</h3>
    <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:1.5rem;">Track a new character or route.</p>
    <form id="pt-form">
      <div class="form-group"><label>Route / Character *</label><input type="text" id="pt-route" class="form-control" placeholder="e.g. Zen's Route" required></div>
      <div class="form-group"><label>Character Photo URL</label><input type="url" id="pt-photo" class="form-control" placeholder="Sprite or art URL…"></div>
      <div class="form-group"><label>Character Notes</label><textarea id="pt-notes" class="form-control" rows="2" placeholder="Describe the character…"></textarea></div>
      <div class="form-group"><label>Start Date</label><input type="date" id="pt-start" class="form-control" value="${today}" required></div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:2;">Start Playing</button>
      </div>
    </form>`);
  document.getElementById('pt-form').onsubmit = e => {
    e.preventDefault();
    appData.playthroughs.push({ id:uid(), gameId:gid,
      route:document.getElementById('pt-route').value,
      characterPhotoUrl:document.getElementById('pt-photo').value,
      characterProfile:document.getElementById('pt-notes').value,
      status:'Playing', startDate:document.getElementById('pt-start').value,
      endDate:'', isFavorite:false });
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
        <div class="star-rating ltr" id="ltr-stars">
          ${[1,2,3,4,5].map(n=>`<input type="radio" id="qs${n}" name="qr" value="${n}"><label for="qs${n}">★</label>`).join('')}
        </div>
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
  openModal(`<h3 style="margin-bottom:1.5rem;">Write a Review</h3>
    <form id="rev-form">
      <div class="form-group"><label>Rating</label>
        <div class="star-rating">
          ${[5,4,3,2,1].map(n=>`<input type="radio" id="s${n}" name="rating" value="${n}" required><label for="s${n}">★</label>`).join('')}
        </div>
      </div>
      <div class="form-group"><label>Your Thoughts</label><textarea id="rev-text" class="form-control" rows="4" required></textarea></div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;background:var(--bg-hover);padding:10px;border-radius:8px;">
        <input type="checkbox" id="rev-spoil" style="accent-color:var(--pink);width:16px;height:16px;">
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
    appData.reviews.push({ id:uid(), playthroughId:pid, rating:r?+r.value:0,
      content:document.getElementById('rev-text').value,
      hasSpoilers:document.getElementById('rev-spoil').checked });
    saveData(); closeModal(); renderView('game-details',appData.playthroughs.find(p=>p.id===pid)?.gameId);
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
        <select id="e-status" class="form-control">
          ${['Want to Play','Playing','Completed','Paused','Dropped'].map(s=>`<option${g.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Tags</label><input type="text" id="e-tags" class="form-control" value="${(g.tags||[]).join(', ')}"></div>
      <div class="form-group"><label>Synopsis</label><textarea id="e-desc" class="form-control" rows="3">${g.description||''}</textarea></div>
      <div style="display:flex;gap:.75rem;margin-top:1.5rem;">
        <button type="button" class="btn btn-ghost" style="flex:1;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:2;">${Icons.check} Save</button>
      </div>
    </form>`);
  document.getElementById('edit-form').onsubmit = e => {
    e.preventDefault();
    g.title = document.getElementById('e-title').value;
    g.coverUrl = document.getElementById('e-cover').value;
    g.developer = document.getElementById('e-dev').value;
    g.platform = document.getElementById('e-platform').value;
    g.status = document.getElementById('e-status').value;
    g.tags = document.getElementById('e-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
    g.description = document.getElementById('e-desc').value;
    saveData(); closeModal(); renderView('game-details',gid);
  };
};

// ── Profile / Settings modal ──────────────────────────────
document.querySelector('.avatar').addEventListener('click', () => {
  const s = appData.settings;
  const total = appData.games.length;
  const done  = appData.playthroughs.filter(p=>p.status==='Completed').length;
  const favs  = appData.playthroughs.filter(p=>p.isFavorite).length;
  openModal(`
    <div style="text-align:center;margin-bottom:2rem;">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--pink),var(--pink-light));margin:0 auto 1rem;border:4px solid var(--bg-card);box-shadow:var(--shadow-m);"></div>
      <h2 style="margin-bottom:.25rem;">My Profile</h2>
      <p style="color:var(--text-muted);font-size:.85rem;">VN Enthusiast</p>
    </div>
    <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:2rem;">
      <div style="text-align:center;"><div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:var(--pink);">${total}</div><div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Games</div></div>
      <div style="text-align:center;"><div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:var(--pink);">${done}</div><div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Completed</div></div>
      <div style="text-align:center;"><div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:var(--pink);">${favs}</div><div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Favorites</div></div>
    </div>
    <div class="divider"></div>
    <h4 style="margin-bottom:1rem;font-size:.95rem;">Settings</h4>
    <div class="toggle-row">
      <span class="toggle-label">Dark Mode</span>
      <label class="toggle-switch"><input type="checkbox" id="dark-toggle" ${s.theme==='dark'?'checked':''}><span class="toggle-slider"></span></label>
    </div>
    <div class="form-group" style="margin-top:1rem;">
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

  document.getElementById('save-settings-btn').onclick = () => {
    appData.settings.theme = document.getElementById('dark-toggle').checked ? 'dark' : 'light';
    appData.settings.backgroundUrl = document.getElementById('bg-url').value;
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
      if (!imported.games) throw new Error('Invalid file');
      if (confirm('This will replace all your current data. Continue?')) {
        appData = imported;
        if (!appData.settings) appData.settings = { theme:'light', backgroundUrl:'' };
        saveData(); closeModal(); renderView('dashboard');
      }
    } catch { alert('Invalid backup file.'); }
  };
  reader.readAsText(file);
};

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
