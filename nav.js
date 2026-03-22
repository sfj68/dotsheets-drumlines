/**
 * Dot Sheets & Drumlines — Shared Navigation
 * Injected into every page. GM Tools link only visible after visiting gm-tools.html.
 * "My Character" lets players pick their character and go to their player sheet.
 */
(function() {
  const IS_GM_KEY     = 'dsd-is-gm';
  const MY_CHAR_KEY   = 'dsd-my-char'; // stored as JSON: {id, name}
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyChSbK9dl3IKFklfLnbVmV3nnMzNqrbDk4",
    authDomain:        "dot-sheets.firebaseapp.com",
    databaseURL:       "https://dot-sheets-default-rtdb.firebaseio.com",
    projectId:         "dot-sheets",
    storageBucket:     "dot-sheets.firebasestorage.app",
    messagingSenderId: "486879488340",
    appId:             "1:486879488340:web:9cdca0cc1bf0bb851140c1"
  };
  const DB_PATH       = 'dsd-campaign';
  const AUTH_EMAIL    = 'campaign@dotsheets.app';
  const AUTH_PASSWORD = 'ohwewillfightfightfightforiowastate';

  // Mark session as GM if on gm-tools
  if (location.pathname.includes('gm-tools.html')) {
    localStorage.setItem(IS_GM_KEY, '1');
  }

  const isGM  = localStorage.getItem(IS_GM_KEY) === '1';
  const page  = location.pathname.split('/').pop() || '';
  const base  = location.origin + location.pathname.replace(/[^/]*$/, '');

  // Saved character
  let savedChar = null;
  try { savedChar = JSON.parse(localStorage.getItem(MY_CHAR_KEY)); } catch(e) {}

  // ── Build nav HTML ──────────────────────────────────────────────────────
  function link(href, label, icon) {
    const active = page === href;
    return `<a href="${href}" class="dsd-nav-link${active ? ' active' : ''}">${icon} ${label}</a>`;
  }

  const myCharLabel = savedChar ? savedChar.name : 'My Character';
  const myCharIsActive = page === 'player-sheet.html' && savedChar;
  const myCharLink = `<button class="dsd-nav-link dsd-nav-btn${myCharIsActive ? ' active' : ''}" onclick="dsdOpenMyChar()" title="${savedChar ? 'Go to your character sheet' : 'Choose your character'}">🧙 ${myCharLabel}</button>`;

  const gmLink = isGM ? link('gm-tools.html', 'GM Tools', '⚙') : '';

  const nav = document.createElement('nav');
  nav.id = 'dsd-nav';
  nav.innerHTML = `
    <div class="dsd-nav-inner">
      <div class="dsd-nav-links">
        ${link('rules.html',             'Rules',            '📖')}
        ${myCharLink}
        ${link('character-creator.html', 'Create Character', '🎭')}
        ${gmLink}
      </div>
      ${isGM ? '' : `<button class="dsd-nav-gm-btn" onclick="dsdUnlockGM()" title="GM access">⚙</button>`}
    </div>

    <!-- Character picker popup -->
    <div id="dsd-char-picker" style="display:none;">
      <div class="dsd-picker-header">
        <span>Choose Your Character</span>
        <button onclick="dsdCloseCharPicker()">✕</button>
      </div>
      <div id="dsd-char-list" class="dsd-char-list">
        <div class="dsd-picker-loading">Connecting to campaign...</div>
      </div>
      ${savedChar ? `<div class="dsd-picker-footer"><button onclick="dsdClearMyChar()">✕ Clear saved character</button></div>` : ''}
    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);

  // ── My Character logic ──────────────────────────────────────────────────
  let fbInitialized = false;
  let fbDb = null;

  function ensureFirebase() {
    if (fbInitialized) return Promise.resolve(fbDb);
    return new Promise((resolve, reject) => {
      try {
        // Avoid re-initializing if already done by the host page
        const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
        fbDb = firebase.database();
        fbInitialized = true;
        firebase.auth().signInWithEmailAndPassword(AUTH_EMAIL, AUTH_PASSWORD)
          .then(() => resolve(fbDb))
          .catch(reject);
      } catch(e) { reject(e); }
    });
  }

  window.dsdOpenMyChar = function() {
    // If we have a saved char and the picker isn't open, navigate directly
    const picker = document.getElementById('dsd-char-picker');
    if (picker.style.display !== 'none') {
      dsdCloseCharPicker();
      return;
    }
    if (savedChar && !event.shiftKey) {
      // Direct navigation — shift+click to re-pick
      window.location.href = `${base}player-sheet.html?char=${savedChar.id}`;
      return;
    }
    // Open picker and load chars
    picker.style.display = 'block';
    const list = document.getElementById('dsd-char-list');
    list.innerHTML = '<div class="dsd-picker-loading">Connecting to campaign...</div>';

    // Try localStorage first (fast path for GM's browser)
    const raw = localStorage.getItem('dsd-chars');
    if (raw) {
      try {
        const chars = JSON.parse(raw).filter(c => !c.isNpc);
        if (chars.length) { renderCharList(chars); return; }
      } catch(e) {}
    }

    // Fall back to Firebase
    ensureFirebase()
      .then(db => db.ref(DB_PATH + '/chars').once('value'))
      .then(snap => {
        const raw = snap.val();
        const chars = (raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : []).filter(c => !c.isNpc);
        renderCharList(chars);
      })
      .catch(e => {
        list.innerHTML = `<div class="dsd-picker-loading" style="color:#c44a1a;">Could not load characters: ${e.message}</div>`;
      });
  };

  function renderCharList(chars) {
    const list = document.getElementById('dsd-char-list');
    if (!chars.length) {
      list.innerHTML = '<div class="dsd-picker-loading">No player characters found yet.</div>';
      return;
    }
    list.innerHTML = chars.map(ch => {
      const cstat = ch.equip === 'Brain' ? 'Brain' : ch.equip === 'Brisk' ? 'Brisk' : 'Brawn';
      const isMine = savedChar && savedChar.id === ch.id;
      return `<button class="dsd-char-option${isMine ? ' mine' : ''}" onclick="dsdPickChar('${ch.id}','${ch.name.replace(/'/g,"\\'")}')">
        <span class="dsd-char-option-name">${ch.name}${isMine ? ' ✓' : ''}</span>
        <span class="dsd-char-option-meta">${ch.cls || 'Custom'} · Rolls ${cstat}</span>
      </button>`;
    }).join('');
  }

  window.dsdPickChar = function(id, name) {
    savedChar = { id, name };
    localStorage.setItem(MY_CHAR_KEY, JSON.stringify(savedChar));
    window.location.href = `${base}player-sheet.html?char=${id}`;
  };

  window.dsdCloseCharPicker = function() {
    const picker = document.getElementById('dsd-char-picker');
    if (picker) picker.style.display = 'none';
  };

  window.dsdClearMyChar = function() {
    localStorage.removeItem(MY_CHAR_KEY);
    savedChar = null;
    dsdCloseCharPicker();
    // Update button label
    const btn = document.querySelector('.dsd-nav-btn');
    if (btn) btn.textContent = '🧙 My Character';
  };

  // Close picker when clicking outside
  document.addEventListener('click', function(e) {
    const picker = document.getElementById('dsd-char-picker');
    const nav    = document.getElementById('dsd-nav');
    if (picker && picker.style.display !== 'none' && !nav.contains(e.target)) {
      dsdCloseCharPicker();
    }
  });

  window.dsdUnlockGM = function() {
    if (confirm('Open GM Tools in a new tab?')) {
      window.open('gm-tools.html', '_blank');
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #dsd-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 500;
      background: rgba(26, 18, 8, 0.95);
      border-top: 1px solid rgba(184, 134, 11, 0.3);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .dsd-nav-inner {
      display: flex;
      align-items: stretch;
      max-width: 900px;
      margin: 0 auto;
    }
    .dsd-nav-links {
      display: flex;
      flex: 1;
      align-items: stretch;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .dsd-nav-links::-webkit-scrollbar { display: none; }
    .dsd-nav-link, .dsd-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 10px 14px;
      font-family: 'Cinzel', serif;
      font-size: 0.62rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(212, 188, 146, 0.7);
      text-decoration: none;
      border: none;
      border-right: 1px solid rgba(184, 134, 11, 0.12);
      background: none;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
      white-space: nowrap;
      flex: 1;
      text-align: center;
    }
    .dsd-nav-link:hover, .dsd-nav-btn:hover {
      color: #d4a017;
      background: rgba(184, 134, 11, 0.08);
    }
    .dsd-nav-link.active, .dsd-nav-btn.active {
      color: #d4a017;
      border-bottom: 2px solid #b8860b;
      background: rgba(184, 134, 11, 0.1);
    }
    .dsd-nav-gm-btn {
      padding: 10px 14px;
      background: none;
      border: none;
      border-left: 1px solid rgba(184, 134, 11, 0.12);
      color: rgba(212, 188, 146, 0.3);
      font-size: 0.9rem;
      cursor: pointer;
      transition: color 0.15s;
    }
    .dsd-nav-gm-btn:hover { color: rgba(212, 188, 146, 0.7); }

    /* ── Character Picker ─────────────────────────────────── */
    #dsd-char-picker {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: min(360px, 96vw);
      background: #1a1208;
      border: 1px solid rgba(184, 134, 11, 0.4);
      border-bottom: none;
      border-radius: 10px 10px 0 0;
      overflow: hidden;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.6);
    }
    .dsd-picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: rgba(184, 134, 11, 0.12);
      border-bottom: 1px solid rgba(184, 134, 11, 0.2);
      font-family: 'Cinzel', serif;
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #d4a017;
    }
    .dsd-picker-header button {
      background: none;
      border: none;
      color: rgba(212, 188, 146, 0.5);
      cursor: pointer;
      font-size: 0.9rem;
      line-height: 1;
      padding: 2px 6px;
      transition: color 0.15s;
    }
    .dsd-picker-header button:hover { color: #d4a017; }
    .dsd-char-list {
      max-height: 260px;
      overflow-y: auto;
      padding: 6px;
    }
    .dsd-picker-loading {
      text-align: center;
      font-family: 'Crimson Pro', serif;
      font-style: italic;
      font-size: 0.88rem;
      color: rgba(212, 188, 146, 0.5);
      padding: 16px;
    }
    .dsd-char-option {
      display: block;
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      background: none;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 4px;
      transition: background 0.15s, border-color 0.15s;
    }
    .dsd-char-option:hover {
      background: rgba(184, 134, 11, 0.1);
      border-color: rgba(184, 134, 11, 0.3);
    }
    .dsd-char-option.mine {
      background: rgba(184, 134, 11, 0.08);
      border-color: rgba(184, 134, 11, 0.25);
    }
    .dsd-char-option-name {
      display: block;
      font-family: 'Cinzel', serif;
      font-size: 0.82rem;
      font-weight: 700;
      color: #f5ead8;
      margin-bottom: 2px;
    }
    .dsd-char-option-meta {
      display: block;
      font-family: 'Crimson Pro', serif;
      font-size: 0.78rem;
      font-style: italic;
      color: rgba(212, 188, 146, 0.55);
    }
    .dsd-picker-footer {
      padding: 8px 10px;
      border-top: 1px solid rgba(184, 134, 11, 0.15);
      text-align: center;
    }
    .dsd-picker-footer button {
      background: none;
      border: none;
      font-family: 'Cinzel', serif;
      font-size: 0.6rem;
      letter-spacing: 0.08em;
      color: rgba(212, 188, 146, 0.35);
      cursor: pointer;
      transition: color 0.15s;
      text-transform: uppercase;
    }
    .dsd-picker-footer button:hover { color: rgba(212, 188, 146, 0.7); }

    body { padding-bottom: 44px !important; }

    @media (max-width: 400px) {
      .dsd-nav-link, .dsd-nav-btn { font-size: 0.52rem; padding: 10px 6px; }
    }
    @media print {
      #dsd-nav { display: none !important; }
      body { padding-bottom: 0 !important; }
    }
  `;
  document.head.appendChild(style);
})();
