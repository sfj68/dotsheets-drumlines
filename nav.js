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
    return `<a href="${href}" class="dsd-nav-link${active ? ' active' : ''}"><span class="dsd-nav-icon">${icon}</span><span class="dsd-nav-label">${label}</span></a>`;
  }

  const myCharLabel = savedChar ? savedChar.name : 'My Character';
  const myCharIsActive = page === 'player-sheet.html' && savedChar;
  const myCharLink = `<button class="dsd-nav-link dsd-nav-btn${myCharIsActive ? ' active' : ''}" onclick="dsdOpenMyChar()" title="${savedChar ? 'Go to your character sheet' : 'Choose your character'}"><span class="dsd-nav-icon">🧙</span><span class="dsd-nav-label">${myCharLabel}</span></button>`;

  const gmLink = isGM ? link('gm-tools.html', 'GM Tools', '⚙') : '';

  const nav = document.createElement('nav');
  nav.id = 'dsd-nav';
  nav.innerHTML = `
    <div class="dsd-nav-inner">
      <div class="dsd-nav-links">
        ${link('index.html',             'Home',             '🏠')}
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

  // ── Dice Roller Widget ───────────────────────────────────────────────────
  const diceWidget = document.createElement('div');
  diceWidget.id = 'ps-dice-widget';
  diceWidget.innerHTML = `
    <button id="ps-dice-toggle" onclick="psDiceToggle()" title="Dice Roller">🎲</button>
    <div id="ps-dice-panel">
      <div class="ps-panel-title">🎲 Dice Roller</div>
      <div class="ps-controls">
        <select id="ps-roll-type">
          <option value="check">Skill Check</option>
          <option value="attack">Attack Roll</option>
          <option value="dodge">Dodge Roll</option>
          <option value="damage">Damage (1d6)</option>
          <option value="crit-damage">Crit Damage (6+1d6)</option>
          <option value="custom">Custom d6 Pool</option>
        </select>
        <input type="number" id="ps-dice-count" value="2" min="0" max="10" title="Stat / dice count">
      </div>
      <div class="ps-cool-row">
        <input type="checkbox" id="ps-use-cool" checked>
        <label for="ps-use-cool">Include Cool Dice</label>
      </div>
      <div class="ps-btns">
        <button class="ps-btn" onclick="psRollDice()">Roll!</button>
        <button class="ps-btn secondary" onclick="psRollDice(true)">0-Stat</button>
        <button class="ps-btn secondary" onclick="psClearHistory()">Clear</button>
      </div>
      <div class="ps-result-box" id="ps-result-box">
        <div class="ps-crit-banner" id="ps-crit-banner"></div>
        <div class="ps-result-main" id="ps-result-main">—</div>
        <div class="ps-result-label" id="ps-result-label">Awaiting roll...</div>
        <div class="ps-all-rolls" id="ps-all-rolls"></div>
        <div class="ps-dice-visual" id="ps-dice-visual"></div>
      </div>
      <div class="ps-history-wrap">
        <button id="ps-history-toggle" class="ps-history-toggle" onclick="psToggleHistory()">History <span class="ps-hist-arrow">▲</span></button>
        <div id="ps-roll-history" class="ps-history"></div>
      </div>
    </div>
  `;
  document.body.appendChild(diceWidget);

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
      min-width: 0;
    }
    .dsd-nav-icon { flex-shrink: 0; }
    .dsd-nav-label { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
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

    /* ── Dice Roller Widget ───────────────────────────────── */
    #ps-dice-widget {
      position: fixed;
      bottom: 54px;
      right: 14px;
      z-index: 490;
    }
    #ps-dice-toggle {
      width: 46px; height: 46px;
      border-radius: 50%;
      background: #8b2a0a;
      border: 2px solid rgba(212,160,23,0.4);
      font-size: 1.3rem;
      cursor: pointer;
      box-shadow: 0 3px 14px rgba(0,0,0,0.55);
      transition: background 0.15s, transform 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    #ps-dice-toggle:hover { background: #a83412; transform: scale(1.08); }
    #ps-dice-toggle.open  { background: #3a2510; border-color: #b8860b; }
    #ps-dice-panel {
      position: absolute;
      bottom: 54px;
      right: 0;
      width: min(320px, 92vw);
      background: #1e1409;
      border: 1px solid rgba(184,134,11,0.45);
      border-radius: 10px;
      padding: 14px;
      box-shadow: 0 -4px 28px rgba(0,0,0,0.65);
      display: none;
    }
    #ps-dice-panel.open { display: block; }
    .ps-panel-title {
      font-family: 'Cinzel', serif;
      font-size: 0.68rem; letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #d4a017;
      margin-bottom: 10px; padding-bottom: 6px;
      border-bottom: 1px solid rgba(184,134,11,0.2);
    }
    .ps-controls { display: flex; gap: 8px; margin-bottom: 8px; }
    .ps-controls select, .ps-controls input[type=number] {
      flex: 1; background: rgba(255,255,255,0.06);
      border: 1px solid rgba(184,134,11,0.3); border-radius: 5px;
      color: #f5ead8; font-family: 'Cinzel', serif;
      font-size: 0.7rem; padding: 6px 8px;
    }
    .ps-controls input[type=number] { max-width: 64px; text-align: center; }
    .ps-cool-row {
      display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
      font-family: 'Crimson Pro', serif; font-size: 0.82rem;
      color: rgba(212,188,146,0.65);
    }
    .ps-cool-row input[type=checkbox] { accent-color: #b8860b; cursor: pointer; }
    .ps-btns { display: flex; gap: 6px; margin-bottom: 10px; }
    .ps-btn {
      flex: 1; font-family: 'Cinzel', serif; font-size: 0.62rem;
      letter-spacing: 0.06em; text-transform: uppercase; padding: 7px 10px;
      border-radius: 4px; cursor: pointer; transition: background 0.15s;
      border: 1px solid rgba(184,134,11,0.3);
      background: #8b2a0a; color: #f5ead8;
    }
    .ps-btn:hover { background: #a83412; }
    .ps-btn.secondary { background: rgba(255,255,255,0.06); color: rgba(212,188,146,0.7); flex: 0 0 auto; }
    .ps-btn.secondary:hover { background: rgba(255,255,255,0.12); }
    .ps-result-box {
      background: rgba(0,0,0,0.35); border: 1px solid rgba(184,134,11,0.25);
      border-radius: 7px; padding: 10px 12px; text-align: center;
      margin-bottom: 8px; position: relative; overflow: hidden; min-height: 74px;
    }
    .ps-crit-banner {
      position: absolute; top: 0; left: 0; right: 0;
      font-family: 'Cinzel Decorative', serif; font-size: 0.58rem;
      letter-spacing: 0.15em; text-align: center; padding: 3px; display: none;
    }
    .ps-crit-banner.show { display: block; }
    .ps-crit-banner.success { background: rgba(0,229,255,0.18); color: #00e5ff; }
    .ps-crit-banner.fail    { background: rgba(255,0,64,0.18);  color: #ff0040; }
    .ps-result-main { font-family: 'Cinzel Decorative', serif; font-size: 2.2rem; line-height: 1; color: #f5ead8; text-shadow: 0 0 16px rgba(212,160,23,0.5); }
    .ps-result-main.result-success  { color: #7cfc00; }
    .ps-result-main.result-mixed    { color: #ffd700; }
    .ps-result-main.result-fail     { color: #ff6b6b; }
    .ps-result-main.result-crit     { color: #00e5ff; }
    .ps-result-main.result-critfail { color: #ff0040; }
    .ps-result-label { font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(212,188,146,0.75); margin-top: 3px; }
    .ps-all-rolls { font-family: 'Crimson Pro', serif; font-size: 0.78rem; color: rgba(212,188,146,0.45); margin-top: 2px; }
    .ps-dice-visual { display: flex; gap: 5px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
    .ps-die { width: 30px; height: 30px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-family: 'Cinzel', serif; font-size: 0.9rem; font-weight: 700; color: #f5ead8; }
    .ps-die.cool     { border-color: #b8860b; background: rgba(184,134,11,0.13); color: #d4a017; }
    .ps-die.d6       { border-color: #7cfc00; color: #7cfc00; background: rgba(124,252,0,0.08); }
    .ps-die.d1       { border-color: #ff6b6b; color: #ff6b6b; background: rgba(255,107,107,0.08); }
    .ps-die.cool.d6  { border-color: #00e5ff; color: #00e5ff; background: rgba(0,229,255,0.12); box-shadow: 0 0 8px rgba(0,229,255,0.45); }
    .ps-die.cool.d1  { border-color: #ff0040; color: #ff0040; background: rgba(255,0,64,0.12);  box-shadow: 0 0 8px rgba(255,0,64,0.45); }
    .ps-die.highest  { box-shadow: 0 0 0 2px rgba(255,255,255,0.65); }
    .ps-history-wrap { margin-top: 2px; }
    .ps-history-toggle {
      display: none; width: 100%; background: none; border: none;
      border-top: 1px solid rgba(184,134,11,0.18);
      color: rgba(212,188,146,0.4); font-family: 'Cinzel', serif; font-size: 0.55rem;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 0;
      cursor: pointer; text-align: center; transition: color 0.15s;
    }
    .ps-history-toggle:hover { color: rgba(212,188,146,0.75); }
    .ps-history-toggle .ps-hist-arrow { display: inline-block; transition: transform 0.2s; margin-left: 4px; }
    .ps-history-toggle.open .ps-hist-arrow { transform: rotate(180deg); }
    .ps-history { max-height: 0; overflow: hidden; transition: max-height 0.25s ease; scrollbar-width: none; }
    .ps-history.open { max-height: 120px; overflow-y: auto; }
    .ps-history::-webkit-scrollbar { display: none; }
    .ps-history-item { font-family: 'Crimson Pro', serif; font-size: 0.78rem; padding: 3px 0; border-bottom: 1px solid rgba(184,134,11,0.12); display: flex; justify-content: space-between; color: rgba(212,188,146,0.65); }
    .ps-history-item:last-child { border-bottom: none; }
    .ps-history-item span:last-child { color: rgba(212,188,146,0.3); font-size: 0.7rem; }
    @keyframes psCritPulse {
      0%   { box-shadow: 0 0 0 3px #00e5ff, 0 0 30px rgba(0,229,255,0.5); }
      100% { box-shadow: 0 0 0 1px rgba(0,229,255,0.1), 0 0 8px rgba(0,229,255,0.1); }
    }
    @keyframes psFailShake {
      0%,100%{ transform:translateX(0); }
      20%    { transform:translateX(-5px); }
      40%    { transform:translateX(5px); }
      60%    { transform:translateX(-4px); }
      80%    { transform:translateX(4px); }
    }
    .ps-result-box.crit-success { animation: psCritPulse 1.4s ease-out forwards; }
    .ps-result-box.crit-fail    { animation: psFailShake 0.65s ease-out; box-shadow: 0 0 0 2px #ff0040, 0 0 20px rgba(255,0,64,0.4); }

    @media (max-width: 560px) {
      .dsd-nav-link, .dsd-nav-btn {
        flex-direction: column;
        gap: 2px;
        padding: 6px 4px 8px;
        font-size: 0.48rem;
        letter-spacing: 0.05em;
        white-space: normal;
      }
      .dsd-nav-icon { font-size: 1.2rem; line-height: 1; flex-shrink: 0; }
      .dsd-nav-label {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
        word-break: break-word;
        white-space: normal;
      }
      body { padding-bottom: 60px !important; }
    }
    @media print {
      #dsd-nav { display: none !important; }
      #ps-dice-widget { display: none !important; }
      body { padding-bottom: 0 !important; }
    }
  `;
  document.head.appendChild(style);

  // ── Dice Roller JS ──────────────────────────────────────────────────────
  let psRollHistory = [];

  window.psDiceToggle = function() {
    const panel  = document.getElementById('ps-dice-panel');
    const toggle = document.getElementById('ps-dice-toggle');
    const isOpen = panel.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
  };

  function psRollD6() { return Math.floor(Math.random() * 6) + 1; }

  window.psRollDice = function(zeroStat = false) {
    const type    = document.getElementById('ps-roll-type').value;
    const useCool = document.getElementById('ps-use-cool').checked;
    const count   = +document.getElementById('ps-dice-count').value || 1;

    if (type === 'damage') {
      const d = psRollD6();
      psRenderDice([{v:d,cool:false}], -1);
      psAddHistory(`Damage: ${d}`);
      psSetResult(d, 'Damage Roll', `Rolled: [${d}]`, '', false, false);
      return;
    }
    if (type === 'crit-damage') {
      const d = psRollD6();
      psRenderDice([{v:d,cool:false}], -1);
      psAddHistory(`Crit Damage: ${6+d} (6+${d})`);
      psSetResult(6+d, 'Critical Damage (6+1d6)', `6 fixed + [${d}]`, 'result-crit', false, false);
      return;
    }
    if (zeroStat) {
      const r1 = psRollD6(), r2 = psRollD6(), res = Math.min(r1, r2);
      psRenderDice([{v:r1,cool:false},{v:r2,cool:false}], res);
      const out = psOutcome6(res);
      psAddHistory(`Zero-Stat: [${r1},${r2}] → ${res} (${out.label})`);
      psSetResult(res, `Zero-Stat: ${out.label}`, `[${r1}, ${r2}] took lower`, out.css, false, false);
      return;
    }
    if (useCool && count >= 2) {
      const c1 = psRollD6(), c2 = psRollD6();
      const regs = Array.from({length: Math.max(0, count - 2)}, psRollD6);
      const all  = [...regs, c1, c2];
      const res  = Math.max(...all);
      psRenderDice([...regs.map(v=>({v,cool:false})), {v:c1,cool:true}, {v:c2,cool:true}], res);
      if (c1 === 6 && c2 === 6) {
        const out = psCritOutcome(type);
        psAddHistory(`★ CRITICAL ${psTypeLabel(type)}! [${all.join(',')}]`);
        psSetResult(res, out.label, `All:[${all.join(',')}]  Cool★:[${c1},${c2}]`, 'result-crit', true, false);
        return;
      }
      if (c1 === 1 && c2 === 1 && type === 'check') {
        psAddHistory(`✕ CRITICAL FAILURE! [${all.join(',')}]`);
        psSetResult(res, 'Critical Failure!', `All:[${all.join(',')}]  Cool★:[${c1},${c2}]`, 'result-critfail', false, true);
        return;
      }
      const out = psOutcome6(res);
      psAddHistory(`${psTypeLabel(type)}: ${res} (${out.label}) [${all.join(',')}]`);
      psSetResult(res, `${psTypeLabel(type)}: ${out.label}`, `All:[${all.join(',')}]  Cool★:[${c1},${c2}]`, out.css, false, false);
    } else {
      const rolls = Array.from({length: Math.max(1, count)}, psRollD6);
      const res   = Math.max(...rolls);
      psRenderDice(rolls.map(v=>({v,cool:false})), res);
      const out = psOutcome6(res);
      psAddHistory(`${psTypeLabel(type)}: ${res} (${out.label}) [${rolls.join(',')}]`);
      psSetResult(res, `${psTypeLabel(type)}: ${out.label}`, `Rolled:[${rolls.join(',')}]`, out.css, false, false);
    }
  };

  function psRenderDice(dice, highest) {
    document.getElementById('ps-dice-visual').innerHTML = dice.map(d => {
      const cls = ['ps-die', d.cool?'cool':'', d.v===6?'d6':'', d.v===1?'d1':'', d.v===highest&&highest>0?'highest':''].filter(Boolean).join(' ');
      return `<div class="${cls}">${d.v}</div>`;
    }).join('');
  }

  function psTypeLabel(t) { return {check:'Check',attack:'Attack',dodge:'Dodge',custom:'Roll'}[t]||'Roll'; }
  function psOutcome6(v)  { return v>=6?{label:'Success!',css:'result-success'}:v>=4?{label:'Mixed Success',css:'result-mixed'}:{label:'Failure',css:'result-fail'}; }
  function psCritOutcome(type) {
    if (type==='attack') return {label:'✦ Critical Hit! — Roll 6+1d6 damage'};
    if (type==='dodge')  return {label:'✦ Critical Defense! — AoO (1d6)'};
    return {label:'✦ Critical Success!'};
  }

  function psSetResult(val, label, sub, css, isCrit, isCritFail) {
    const box    = document.getElementById('ps-result-box');
    const banner = document.getElementById('ps-crit-banner');
    box.classList.remove('crit-success','crit-fail');
    banner.className = 'ps-crit-banner'; banner.textContent = '';
    void box.offsetWidth;
    if (isCrit)     { box.classList.add('crit-success'); banner.classList.add('show','success'); banner.textContent = '✦ ✦ ✦  Critical!  ✦ ✦ ✦'; }
    else if (isCritFail) { box.classList.add('crit-fail'); banner.classList.add('show','fail'); banner.textContent = '✕  Critical Failure  ✕'; }
    document.getElementById('ps-result-main').textContent  = val;
    document.getElementById('ps-result-main').className    = `ps-result-main ${css}`;
    document.getElementById('ps-result-label').textContent = label;
    document.getElementById('ps-all-rolls').textContent    = sub;
  }

  function psAddHistory(msg) {
    psRollHistory.unshift({msg, time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
    if (psRollHistory.length > 10) psRollHistory.pop();
    document.getElementById('ps-roll-history').innerHTML = psRollHistory
      .map(r=>`<div class="ps-history-item"><span>${r.msg}</span><span>${r.time}</span></div>`)
      .join('');
    document.getElementById('ps-history-toggle').style.display = 'block';
  }

  window.psClearHistory = function() {
    psRollHistory = [];
    document.getElementById('ps-roll-history').innerHTML = '';
    const toggle = document.getElementById('ps-history-toggle');
    toggle.style.display = 'none';
    toggle.classList.remove('open');
    document.getElementById('ps-roll-history').classList.remove('open');
  };

  window.psToggleHistory = function() {
    const toggle = document.getElementById('ps-history-toggle');
    const list   = document.getElementById('ps-roll-history');
    const isOpen = list.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
  };
})();
