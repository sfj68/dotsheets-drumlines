/**
 * Dot Sheets & Drumlines — Sheet Renderer
 * Shared module for generating and printing character sheets.
 * Call dsdPrintSheets(charsArray) or dsdPrintBlankSheet() from any page.
 */
(function(global) {

// ── CSS ─────────────────────────────────────────────────────────────────────
const SHEET_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

  :root {
    --ink: #1a1208;
    --parchment: #f5ead8;
    --parchment-dark: #e8d5b5;
    --parchment-darker: #d4bc92;
    --accent: #8b2a0a;
    --gold: #b8860b;
    --gold-light: #d4a017;
    --border: #a08050;
    --border-light: #c8a870;
    --shadow: rgba(26,18,8,0.2);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: #2a1f0e;
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(139,42,10,0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 80%, rgba(184,134,11,0.1) 0%, transparent 60%);
    font-family: 'Crimson Pro', Georgia, serif;
    color: var(--ink);
    min-height: 100vh;
    padding: 24px 16px;
  }

  .sheets-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
    align-items: center;
  }

  .sheet {
    background: var(--parchment);
    border: 2px solid var(--border);
    border-radius: 6px;
    width: 100%;
    max-width: 780px;
    padding: 32px 36px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    position: relative;
    page-break-after: always;
  }

  .sheet::before, .sheet::after {
    content: '';
    position: absolute;
    width: 32px; height: 32px;
    border-color: var(--gold);
    border-style: solid;
    opacity: 0.5;
  }
  .sheet::before { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
  .sheet::after  { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

  .sheet-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--border);
    position: relative;
  }
  .sheet-header::after {
    content: '✦';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--parchment);
    padding: 0 8px;
    color: var(--gold);
    font-size: 0.9rem;
  }
  .game-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 0.7rem;
    color: var(--gold);
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 4px;
    opacity: 0.8;
  }
  .char-name-display {
    font-family: 'Cinzel', serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.1;
  }
  .char-meta {
    font-family: 'Crimson Pro', serif;
    font-style: italic;
    font-size: 1rem;
    color: var(--accent);
    margin-top: 2px;
  }

  .sec-label {
    font-family: 'Cinzel', serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 6px;
  }

  .top-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 20px;
    margin-top: 24px;
    margin-bottom: 20px;
    align-items: start;
  }

  .stats-block { display: flex; gap: 10px; }
  .stat-cell {
    width: 68px;
    text-align: center;
    background: var(--parchment-dark);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 4px 6px;
  }
  .stat-cell .stat-name {
    font-family: 'Cinzel', serif;
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .stat-cell .stat-value {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.9rem;
    line-height: 1;
    color: var(--ink);
    font-weight: 700;
  }
  .stat-cell .stat-sub {
    font-family: 'Crimson Pro', serif;
    font-size: 0.7rem;
    color: #888;
    margin-top: 2px;
    font-style: italic;
  }

  .derived-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
  }
  .derived-row {
    display: flex;
    align-items: stretch;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .derived-label {
    font-family: 'Cinzel', serif;
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--parchment);
    background: var(--accent);
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    padding: 6px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 20px;
  }
  .derived-label.gold-bg { background: var(--gold); }
  .derived-boxes {
    display: flex;
    flex: 1;
    background: var(--parchment-dark);
  }
  .derived-box {
    flex: 1;
    aspect-ratio: 1;
    border-right: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.1rem;
    color: var(--ink);
    min-width: 28px;
    min-height: 28px;
  }
  .derived-box:last-child { border-right: none; }
  .derived-box.filled { background: rgba(139,42,10,0.12); }
  .derived-box.gold-filled { background: rgba(184,134,11,0.18); }

  .equip-block { min-width: 140px; }
  .equip-type-badge {
    display: inline-block;
    font-family: 'Cinzel', serif;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: var(--accent);
    color: var(--parchment);
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 6px;
  }
  .write-line {
    border-bottom: 1px solid var(--border);
    min-height: 1.6em;
    margin-bottom: 6px;
  }

  .marks-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    padding: 10px 14px;
    background: var(--parchment-dark);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .marks-label {
    font-family: 'Cinzel', serif;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    flex-shrink: 0;
  }
  .mark-circles { display: flex; gap: 8px; flex: 1; }
  .mark-circle {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: transparent;
    flex-shrink: 0;
  }
  .mark-circle.filled { background: var(--accent); }
  .marks-note {
    font-family: 'Crimson Pro', serif;
    font-size: 0.8rem;
    font-style: italic;
    color: #777;
    flex: 1;
    text-align: right;
  }

  .abilities-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px;
  }
  .ability-box {
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .ability-header {
    font-family: 'Cinzel', serif;
    font-size: 0.58rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--parchment);
    background: var(--gold);
    padding: 4px 10px;
  }
  .ability-content {
    padding: 6px 10px;
    font-family: 'Crimson Pro', serif;
    font-size: 0.95rem;
    font-style: italic;
    color: var(--ink);
    background: var(--parchment-dark);
    min-height: 42px;
    line-height: 1.5;
  }
  .ability-content.empty { background: var(--parchment-dark); padding: 6px 10px; }

  .lower-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .lined-box { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .lined-box-header {
    font-family: 'Cinzel', serif;
    font-size: 0.58rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--parchment);
    background: var(--accent);
    padding: 4px 10px;
  }
  .lined-box-header.gold-bg { background: var(--gold); color: var(--ink); }
  .lined-box-body { background: var(--parchment-dark); padding: 6px 10px; }
  .ruled-line { border-bottom: 1px solid var(--border-light); height: 26px; display: block; }

  .notes-section { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .notes-section-header {
    font-family: 'Cinzel', serif;
    font-size: 0.58rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--parchment);
    background: var(--accent);
    padding: 4px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .notes-body { background: var(--parchment-dark); padding: 6px 10px; }

  .ref-footer {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    border-top: 1px solid var(--border);
    padding-top: 14px;
    margin-top: 4px;
  }
  .ref-col-title {
    font-family: 'Cinzel', serif;
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
    border-bottom: 1px solid var(--parchment-darker);
    padding-bottom: 2px;
  }
  .ref-row {
    display: flex;
    justify-content: space-between;
    font-family: 'Crimson Pro', serif;
    font-size: 0.72rem;
    line-height: 1.7;
    color: var(--ink);
  }
  .ref-row span:first-child { font-weight: 600; color: var(--accent); }

  @media screen and (max-width: 768px) {
    body { padding: 8px; }
    .sheet { padding: 12px; margin: 0 auto; }
    .top-row { display: flex !important; flex-direction: column; gap: 14px; }
    .top-row > div { width: 100% !important; }
    .derived-block { min-width: 0 !important; }
    .equip-block { min-width: 0 !important; }
    .stats-block { justify-content: center; }
    .ref-footer { grid-template-columns: repeat(2, 1fr) !important; gap: 8px; }
    .sheet-header .char-name-display { font-size: clamp(1.2rem, 5vw, 2rem); }
    .marks-row { flex-wrap: wrap; gap: 6px; }
    .marks-note { font-size: 0.6rem; }
  }
  @media screen and (max-width: 480px) {
    .sheet { padding: 8px; }
    .ref-footer { grid-template-columns: 1fr !important; }
    .stats-block { gap: 6px; }
    .stat-cell { min-width: 60px; }
  }

  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { background: white !important; padding: 0; margin: 0; }
    .sheets-container { gap: 0; }
    .sheet {
      box-shadow: none;
      border: 1px solid #888;
      border-radius: 0;
      max-width: 100%;
      width: 100%;
      padding: 8mm 10mm;
      margin: 0;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .sheet:last-child { page-break-after: auto; }
    .sheet-header { margin-bottom: 6px; padding-bottom: 6px; }
    .char-name-display { font-size: 1.4rem; }
    .char-meta { font-size: 0.8rem; margin-top: 0; }
    .game-title { font-size: 0.55rem; margin-bottom: 2px; }
    .top-row { gap: 10px; margin-top: 8px; margin-bottom: 8px; }
    .stat-cell { width: 54px; padding: 4px 2px; }
    .stat-cell .stat-value { font-size: 1.4rem; }
    .stat-cell .stat-name { font-size: 0.48rem; }
    .stat-cell .stat-sub { font-size: 0.58rem; margin-top: 1px; }
    .stats-block { gap: 6px; }
    .derived-block { gap: 6px; }
    .derived-box { min-width: 20px; min-height: 20px; font-size: 0.85rem; }
    .equip-block { min-width: 110px; }
    .marks-row { padding: 5px 8px; margin-bottom: 8px; }
    .mark-circle { width: 20px; height: 20px; }
    .marks-note { font-size: 0.68rem; }
    .marks-label { font-size: 0.52rem; }
    .abilities-row { gap: 8px; margin-bottom: 8px; }
    .ability-content { min-height: 28px; padding: 4px 8px; font-size: 0.82rem; }
    .ability-header { padding: 2px 8px; font-size: 0.5rem; }
    .lower-grid { gap: 8px; margin-bottom: 8px; }
    .lined-box-header { padding: 2px 8px; font-size: 0.5rem; }
    .lined-box-body { padding: 3px 8px; }
    .ruled-line { height: 20px; }
    .notes-section { margin-bottom: 8px; }
    .notes-section-header { padding: 2px 8px; font-size: 0.5rem; }
    .notes-body { padding: 3px 8px; }
    .ref-footer { padding-top: 6px; gap: 6px; }
    .ref-col-title { font-size: 0.48rem; margin-bottom: 2px; }
    .ref-row { font-size: 0.62rem; line-height: 1.5; }
    .sec-label { font-size: 0.5rem; margin-bottom: 3px; }
    .sheet::before, .sheet::after { width: 20px; height: 20px; }
  }

  @page { size: letter portrait; margin: 6mm; }
`;

// ── HELPERS ─────────────────────────────────────────────────────────────────
function ruledLines(count) {
  return Array.from({length: count}, () => `<div class="ruled-line"></div>`).join('');
}

function buildTrackBoxes(max, current, filledClass, perRow, cap) {
  const total = Math.min(max, cap);
  const rows = Math.ceil(total / perRow);
  let html = '<div style="display:flex;flex-direction:column;gap:3px;">';
  for (let r = 0; r < rows; r++) {
    html += '<div style="display:flex;gap:3px;">';
    for (let i = 0; i < perRow && (r * perRow + i) < total; i++) {
      const idx = r * perRow + i;
      const isFilled = idx < current;
      html += `<div style="width:20px;height:20px;border:1.5px solid var(--accent);border-radius:3px;background:${isFilled ? 'rgba(139,42,10,0.15)' : 'transparent'};flex-shrink:0;"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function buildAPDots(maxAp, currentAp) {
  return Array.from({length: maxAp}, (_, i) =>
    `<div class="derived-box ${i < currentAp ? 'gold-filled' : ''}"></div>`
  ).join('');
}

// ── SHEET BUILDERS ──────────────────────────────────────────────────────────
function buildSheet(ch) {
  const cstat = ['Brawn','Brain','Brisk'].includes(ch.equip) ? ch.equip : ch.equip==='Magic'?'Brain':ch.equip==='Projectile'?'Brisk':'Brawn';
  const abilityName = ch.abilityName || ch.ability || '';
  const abilityDesc = ch.abilityDesc || '';

  const hpBoxes = buildTrackBoxes(ch.maxHp, ch.hp, 'filled', 10, 40);
  const apBoxes = buildAPDots(ch.maxAp, ch.ap);

  const markCircles = Array.from({length: 5}, (_, i) =>
    `<div class="mark-circle ${i < (ch.marks || 0) ? 'filled' : ''}"></div>`
  ).join('');

  const equipItems = (ch.inventory || []).filter(it => it.equipment);
  const equipContent = equipItems.length
    ? equipItems.map(it => `<div style="font-family:'Crimson Pro',serif;font-size:0.75rem;padding:2px 0;border-bottom:1px solid var(--border-light);">${it.name}${it.desc ? ` <span style="font-style:italic;color:#666;">— ${it.desc}</span>` : ''}</div>`).join('') + ruledLines(Math.max(0, 4 - equipItems.length))
    : ruledLines(4);

  const conItems = (ch.connections || []);
  const typeLabel = { person:'Person', place:'Place', faction:'Faction', other:'Other' };
  const conContent = conItems.length
    ? conItems.map(conn => `<div style="display:flex;align-items:baseline;gap:8px;border-bottom:1px solid var(--border-light);padding:3px 0;font-size:0.82rem;">
        <span style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);min-width:42px;text-transform:uppercase;letter-spacing:0.04em;">${typeLabel[conn.type]||conn.type||''}</span>
        <span style="flex:1;">${conn.name}${conn.notes ? ` <span style="font-style:italic;color:#666;font-size:0.78rem;">— ${conn.notes}</span>` : ''}</span>
      </div>`).join('') + ruledLines(Math.max(0, 6 - conItems.length))
    : ruledLines(6);

  const portraitHtml = ch.portrait
    ? `<img src="${ch.portrait}" style="position:absolute;right:0;top:0;width:70px;height:88px;object-fit:cover;border:2px solid var(--border);border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">`
    : '';

  const frontPage = `
  <div class="sheet">
    <div class="sheet-header">
      ${portraitHtml}
      <div class="game-title">Dot Sheets &amp; Drumlines · Character Sheet</div>
      <div class="char-name-display">${ch.name}</div>
      <div class="char-meta">${ch.cls || 'Custom'} · Rolls ${cstat} in combat</div>
      ${ch.flavorText ? `<div style="font-family:'Crimson Pro',serif;font-size:0.88rem;font-style:italic;color:#666;margin-top:4px;">${ch.flavorText}</div>` : ''}
    </div>

    <div class="top-row">
      <div>
        <div class="sec-label">Primary Stats</div>
        <div class="stats-block">
          <div class="stat-cell">
            <div class="stat-name">Brawn</div>
            <div class="stat-value">${ch.brawn}</div>
            <div class="stat-sub">Physical</div>
          </div>
          <div class="stat-cell">
            <div class="stat-name">Brain</div>
            <div class="stat-value">${ch.brain}</div>
            <div class="stat-sub">Mental</div>
          </div>
          <div class="stat-cell">
            <div class="stat-name">Brisk</div>
            <div class="stat-value">${ch.brisk}</div>
            <div class="stat-sub">Speed</div>
          </div>
        </div>
        <div class="sec-label" style="margin-top:8px;">Conditions</div>
        <div style="border:1px solid var(--border);border-radius:4px;background:var(--parchment-dark);padding:2px 5px;">${ruledLines(3)}</div>
      </div>

      <div class="derived-block">
        <div>
          <div class="sec-label">Hit Points — ${ch.maxHp} max (cross off as you take damage)</div>
          <div class="derived-row">
            <div class="derived-label">HP</div>
            <div style="flex:1;background:var(--parchment-dark);padding:4px 6px;">${hpBoxes}</div>
          </div>
        </div>
        <div>
          <div class="sec-label">Action Points — ${ch.maxAp} per round</div>
          <div class="derived-row">
            <div class="derived-label gold-bg">AP</div>
            <div class="derived-boxes">${apBoxes}</div>
          </div>
        </div>
        <div style="display:flex;gap:16px;font-family:'Crimson Pro',serif;font-size:0.78rem;color:#666;font-style:italic;">
          <span>Speed: <strong style="font-style:normal;color:var(--ink);">6</strong></span>
          <span>HP = 20 + (Brawn × 5)</span>
          <span>AP = 1 + Brain</span>
        </div>
      </div>

      <div class="equip-block">
        <div class="sec-label">Combat Stat</div>
        <div><span class="equip-type-badge">Rolls ${cstat}</span></div>
        <div class="sec-label" style="margin-top:8px;">Special Equipment</div>
        ${equipContent}
      </div>
    </div>

    <div class="marks-row">
      <div class="marks-label">Marks</div>
      <div class="mark-circles">${markCircles}</div>
      <div class="marks-note">When HP = 0: take a Mark, choose −1 to a primary stat, reset HP to max</div>
    </div>

    <div style="margin-bottom:12px;">
      <div class="ref-col-title" style="margin-bottom:4px;">⚡ AP Actions (1 AP each) — you are not limited to these</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px 10px;font-size:0.72rem;font-family:'Crimson Pro',serif;">
        <div style="padding:3px 0;border-bottom:1px solid rgba(160,128,80,0.2);"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Radial Attack</strong><br>Hit all enemies within 1 unit of target.</div>
        <div style="padding:3px 0;border-bottom:1px solid rgba(160,128,80,0.2);"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Piercing Attack</strong><br>Hit all in a line from target, up to 3 units.</div>
        <div style="padding:3px 0;border-bottom:1px solid rgba(160,128,80,0.2);"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Helping Hand</strong><br>Ally adds +1d6 to next roll, takes better.</div>
        <div style="padding:3px 0;"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Scan</strong><br>Ask GM one honest question about enemy or environment.</div>
        <div style="padding:3px 0;"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Brace</strong><br>Take half damage on next hit, ignores dodge.</div>
        <div style="padding:3px 0;"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Taunt</strong><br>Force nearby enemy to target you next turn.</div>
      </div>
    </div>

    <div class="sec-label">Special Ability</div>
    <div class="ability-box" style="margin-bottom:14px;">
      <div class="ability-header">✦ ${abilityName || 'Ability Name'}</div>
      ${abilityDesc
        ? `<div class="ability-content">${abilityDesc}</div>`
        : `<div class="ability-content empty">${ruledLines(4)}</div>`}
    </div>

    <div class="sec-label" style="margin-bottom:4px;">🔗 Connections</div>
    <div style="background:var(--parchment-dark);border:1px solid var(--border);border-radius:6px;padding:4px 10px;margin-bottom:10px;">
      ${conContent}
    </div>

    <div class="ref-footer">
      <div>
        <div class="ref-col-title">Skill Checks</div>
        <div class="ref-row"><span>1–3</span><span>Fail + Consequences</span></div>
        <div class="ref-row"><span>4–5</span><span>Mixed Success</span></div>
        <div class="ref-row"><span>6</span><span>Full Success</span></div>
      </div>
      <div>
        <div class="ref-col-title">Attack Rolls</div>
        <div class="ref-row"><span>1–3</span><span>Miss + Consequences</span></div>
        <div class="ref-row"><span>4–5</span><span>Hit, consequences</span></div>
        <div class="ref-row"><span>6</span><span>Hit, full dmg (1d6)</span></div>
      </div>
      <div>
        <div class="ref-col-title">Dodge Rolls</div>
        <div class="ref-row"><span>1–3</span><span>Full damage</span></div>
        <div class="ref-row"><span>4–5</span><span>Half damage (↑)</span></div>
        <div class="ref-row"><span>6</span><span>No damage</span></div>
      </div>
      <div>
        <div class="ref-col-title">Criticals</div>
        <div class="ref-row"><span>Crit Hit</span><span>6 + 1d6 dmg</span></div>
        <div class="ref-row"><span>Crit Def</span><span>AoO (1d6)</span></div>
        <div class="ref-row"><span>Crit Fail</span><span>Auto-fail</span></div>
        <div class="ref-row" style="font-size:0.62rem;color:#888;font-style:italic;">Both Cool Dice = 6 → Critical</div>
      </div>
    </div>
  </div>`;

  const invItems = (ch.inventory || []);
  const invContent = invItems.length
    ? invItems.map(it => {
        const mods = it.mods || {};
        const modStr = Object.entries(mods).filter(([,v])=>v)
          .map(([k,v]) => `${v>0?'+':''}${v} ${({brawn:'Brawn',brain:'Brain',brisk:'Brisk',hp:'HP',ap:'AP',speed:'Spd'})[k]||k}`)
          .join(', ');
        return `<div style="display:flex;align-items:baseline;gap:8px;border-bottom:1px solid var(--border-light);padding:3px 0;font-size:0.82rem;">
          <span style="font-family:'Cinzel',serif;font-size:0.72rem;font-weight:700;min-width:12px;">◦</span>
          <span style="flex:1;font-style:${it.equipped?'normal':'italic'};opacity:${it.equipped?1:0.55};">${it.name}${it.desc ? ` — ${it.desc}` : ''}${modStr ? ` <span style="color:var(--accent);font-size:0.7rem;">[${modStr}]</span>` : ''}</span>
        </div>`;
      }).join('') + ruledLines(Math.max(0, 14 - invItems.length))
    : ruledLines(14);

  const notesContent = ch.notes
    ? `<div style="font-family:'Crimson Pro',serif;font-size:0.9rem;line-height:1.6;padding:4px 0 8px;color:var(--ink);white-space:pre-wrap;">${ch.notes}</div>${ruledLines(14)}`
    : ruledLines(22);

  const backPage = `
  <div class="sheet">
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--border);padding-bottom:8px;margin-bottom:16px;">
      <div>
        <div class="game-title" style="margin-bottom:2px;">Dot Sheets &amp; Drumlines · Character Sheet (reverse)</div>
        <div style="font-family:'Cinzel',serif;font-size:1.3rem;font-weight:700;color:var(--ink);">${ch.name}</div>
      </div>
      <div style="font-family:'Crimson Pro',serif;font-style:italic;font-size:0.85rem;color:var(--accent);">${ch.cls || 'Custom'} · Rolls ${cstat}</div>
    </div>

    <div class="sec-label" style="margin-bottom:6px;">⚔ Inventory &amp; Items</div>
    <div style="background:var(--parchment-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;margin-bottom:14px;">
      ${invContent}
    </div>

    <div class="notes-section" style="margin-bottom:14px;">
      <div class="notes-section-header"><span>📜 Notes &amp; Description</span></div>
      <div class="notes-body">${notesContent}</div>
    </div>
  </div>`;

  return frontPage + backPage;
}

function buildBlankSheet() {
  const writeLine = (w = '100%') =>
    `<div style="border-bottom:1.5px solid var(--ink);min-height:1.5em;width:${w};display:inline-block;">&nbsp;</div>`;

  const blankStatCell = (label, sub) => `
    <div class="stat-cell">
      <div class="stat-name">${label}</div>
      <div class="stat-value" style="border-bottom:2px solid var(--border);margin:4px 8px 2px;min-height:1.1em;">&nbsp;</div>
      <div class="stat-sub">${sub}</div>
    </div>`;

  const hpBoxes = buildTrackBoxes(20, 0, 'filled', 10, 40);
  const apBoxes = buildAPDots(5, 0);
  const markCircles = Array.from({length: 5}, () => `<div class="mark-circle"></div>`).join('');

  const frontPage = `
  <div class="sheet">
    <div class="sheet-header">
      <div class="game-title">Dot Sheets &amp; Drumlines · Character Sheet</div>
      <div class="char-name-display" style="border-bottom:2px solid var(--ink);min-height:1.2em;margin:4px 20px;">&nbsp;</div>
      <div class="char-meta" style="display:flex;gap:12px;justify-content:center;align-items:center;margin-top:6px;">
        <span style="font-size:0.75rem;font-family:'Cinzel',serif;letter-spacing:0.06em;">Class:</span>
        <span style="border-bottom:1.5px solid var(--ink);min-width:120px;display:inline-block;">&nbsp;</span>
        <span style="font-size:0.75rem;font-family:'Cinzel',serif;letter-spacing:0.06em;">Rolls:</span>
        <span style="font-size:0.82rem;font-family:'Cinzel',serif;">○&nbsp;Brawn &nbsp; ○&nbsp;Brain &nbsp; ○&nbsp;Brisk</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:5px;">
        <span style="font-size:0.72rem;font-family:'Cinzel',serif;letter-spacing:0.06em;white-space:nowrap;">Flavor Text:</span>
        <span style="border-bottom:1.5px solid var(--ink);flex:1;display:inline-block;">&nbsp;</span>
      </div>
    </div>

    <div class="top-row">
      <div>
        <div class="sec-label">Primary Stats</div>
        <div class="stats-block">
          ${blankStatCell('Brawn','Physical')}
          ${blankStatCell('Brain','Mental')}
          ${blankStatCell('Brisk','Speed')}
        </div>
        <div class="sec-label" style="margin-top:8px;">Conditions</div>
        <div style="border:1px solid var(--border);border-radius:4px;background:var(--parchment-dark);padding:2px 5px;">${ruledLines(3)}</div>
      </div>

      <div class="derived-block">
        <div>
          <div class="sec-label">Hit Points — <span style="border-bottom:1px solid var(--ink);display:inline-block;min-width:28px;">&nbsp;</span> max &nbsp;(cross off as you take damage)</div>
          <div class="derived-row">
            <div class="derived-label">HP</div>
            <div style="flex:1;background:var(--parchment-dark);padding:4px 6px;">${hpBoxes}</div>
          </div>
        </div>
        <div>
          <div class="sec-label">Action Points — <span style="border-bottom:1px solid var(--ink);display:inline-block;min-width:18px;">&nbsp;</span> per round</div>
          <div class="derived-row">
            <div class="derived-label gold-bg">AP</div>
            <div class="derived-boxes">${apBoxes}</div>
          </div>
        </div>
        <div style="display:flex;gap:16px;font-family:'Crimson Pro',serif;font-size:0.78rem;color:#666;font-style:italic;">
          <span>Speed: <strong style="font-style:normal;color:var(--ink);">6</strong></span>
          <span>HP = 20 + (Brawn × 5)</span>
          <span>AP = 1 + Brain</span>
        </div>
      </div>

      <div class="equip-block">
        <div class="sec-label">Carried / Other</div>
        ${ruledLines(5)}
      </div>
    </div>

    <div class="marks-row">
      <div class="marks-label">Marks</div>
      <div class="mark-circles">${markCircles}</div>
      <div class="marks-note">When HP = 0: take a Mark, choose −1 to a primary stat, reset HP to max</div>
    </div>

    <div style="margin-bottom:12px;">
      <div class="ref-col-title" style="margin-bottom:4px;">⚡ AP Actions (1 AP each) — you are not limited to these</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px 10px;font-size:0.72rem;font-family:'Crimson Pro',serif;">
        <div style="padding:3px 0;border-bottom:1px solid rgba(160,128,80,0.2);"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Radial Attack</strong><br>Hit all enemies within 1 unit of target.</div>
        <div style="padding:3px 0;border-bottom:1px solid rgba(160,128,80,0.2);"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Piercing Attack</strong><br>Hit all in a line from target, up to 3 units.</div>
        <div style="padding:3px 0;border-bottom:1px solid rgba(160,128,80,0.2);"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Helping Hand</strong><br>Ally adds +1d6 to next roll, takes better.</div>
        <div style="padding:3px 0;"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Scan</strong><br>Ask GM one honest question about enemy or environment.</div>
        <div style="padding:3px 0;"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Brace</strong><br>Take half damage on next hit, ignores dodge.</div>
        <div style="padding:3px 0;"><strong style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--accent);">Taunt</strong><br>Force nearby enemy to target you next turn.</div>
      </div>
    </div>

    <div class="sec-label">Special Ability</div>
    <div class="ability-box" style="margin-bottom:14px;">
      <div class="ability-header" style="display:flex;align-items:center;gap:8px;">
        ✦ <span style="border-bottom:1px solid rgba(255,255,255,0.6);flex:1;display:inline-block;min-height:1em;">&nbsp;</span>
      </div>
      <div class="ability-content empty">${ruledLines(4)}</div>
    </div>

    <div class="sec-label" style="margin-bottom:4px;">🔗 Connections</div>
    <div style="background:var(--parchment-dark);border:1px solid var(--border);border-radius:6px;padding:4px 10px;margin-bottom:10px;">
      ${ruledLines(6)}
    </div>

    <div class="ref-footer">
      <div>
        <div class="ref-col-title">Skill Checks</div>
        <div class="ref-row"><span>1–3</span><span>Fail + Consequences</span></div>
        <div class="ref-row"><span>4–5</span><span>Mixed Success</span></div>
        <div class="ref-row"><span>6</span><span>Full Success</span></div>
      </div>
      <div>
        <div class="ref-col-title">Attack Rolls</div>
        <div class="ref-row"><span>1–3</span><span>Miss + Consequences</span></div>
        <div class="ref-row"><span>4–5</span><span>Hit, consequences</span></div>
        <div class="ref-row"><span>6</span><span>Hit, full dmg (1d6)</span></div>
      </div>
      <div>
        <div class="ref-col-title">Dodge Rolls</div>
        <div class="ref-row"><span>1–3</span><span>Full damage</span></div>
        <div class="ref-row"><span>4–5</span><span>Half damage (↑)</span></div>
        <div class="ref-row"><span>6</span><span>No damage</span></div>
      </div>
      <div>
        <div class="ref-col-title">Criticals</div>
        <div class="ref-row"><span>Crit Hit</span><span>6 + 1d6 dmg</span></div>
        <div class="ref-row"><span>Crit Def</span><span>AoO (1d6)</span></div>
        <div class="ref-row"><span>Crit Fail</span><span>Auto-fail</span></div>
        <div class="ref-row" style="font-size:0.62rem;color:#888;font-style:italic;">Both Cool Dice = 6 → Critical</div>
      </div>
    </div>
  </div>`;

  const backPage = `
  <div class="sheet">
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--border);padding-bottom:8px;margin-bottom:16px;">
      <div>
        <div class="game-title" style="margin-bottom:2px;">Dot Sheets &amp; Drumlines · Character Sheet (reverse)</div>
        <div style="font-family:'Cinzel',serif;font-size:1.3rem;font-weight:700;color:var(--ink);border-bottom:1.5px solid var(--ink);min-width:220px;">&nbsp;</div>
      </div>
      <div style="font-family:'Crimson Pro',serif;font-style:italic;font-size:0.85rem;color:var(--accent);display:flex;align-items:center;gap:8px;">
        <span style="border-bottom:1px solid var(--accent);min-width:80px;">&nbsp;</span>
        <span>· ○ Brawn ○ Brain ○ Brisk</span>
      </div>
    </div>

    <div class="sec-label" style="margin-bottom:6px;">⚔ Inventory &amp; Items</div>
    <div style="background:var(--parchment-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;margin-bottom:14px;">
      ${ruledLines(14)}
    </div>

    <div class="notes-section" style="margin-bottom:14px;">
      <div class="notes-section-header"><span>📜 Notes &amp; Description</span></div>
      <div class="notes-body">${ruledLines(22)}</div>
    </div>
  </div>`;

  return frontPage + backPage;
}

// ── IMAGE COMPRESSION ───────────────────────────────────────────────────────
global.dsdCompressPortrait = function(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Not an image')); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ── PUBLIC API ───────────────────────────────────────────────────────────────
function openPrintWindow(sheetsHtml) {
  const win = window.open('', '_blank');
  if (!win) { alert('Pop-up blocked — please allow pop-ups for this page and try again.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dot Sheets &amp; Drumlines — Character Sheets</title>
<style>${SHEET_CSS}</style>
</head>
<body>
<div class="sheets-container">${sheetsHtml}</div>
<script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`);
  win.document.close();
}

global.dsdPrintSheets = function(charsArray) {
  if (!charsArray || !charsArray.length) {
    alert('No characters to print.');
    return;
  }
  const html = charsArray.map(ch => buildSheet(ch)).join('');
  openPrintWindow(html);
};

global.dsdPrintBlankSheet = function() {
  openPrintWindow(buildBlankSheet());
};

})(window);
