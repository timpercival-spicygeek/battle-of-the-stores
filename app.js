const SHEET_ID = '16h5Es-wSjMliqfT4I59HEpSMjXP8lspta-wTZrPHhkw';
const SHEET_NAME = 'Website Feed';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const fallbackData = {
  latestThursday: '2026-09-03',
  standings: [
    { storeNo: '1031', store: 'Trainyards', points: 0, rank: 7 },
    { storeNo: '1075', store: 'Carleton Place', points: 0, rank: 7 },
    { storeNo: '1110', store: 'Baseline', points: 1, rank: 1 },
    { storeNo: '1118', store: 'Kanata Stittsville', points: 1, rank: 1 },
    { storeNo: '3066', store: 'Bayshore', points: 1, rank: 1 },
    { storeNo: '3078', store: 'Renfrew', points: 0, rank: 7 },
    { storeNo: '3131', store: 'Ottawa South', points: 1, rank: 1 },
    { storeNo: '3134', store: 'Kanata Centrum', points: 0, rank: 7 },
    { storeNo: '3171', store: 'Pembroke', points: 1, rank: 1 },
    { storeNo: '3638', store: 'Barrhaven', points: 1, rank: 1 }
  ],
  battles: [
    { date:'2026-09-03', battle:1, store1:'Kanata Stittsville', tpp1:0, point1:false, store2:'Barrhaven', tpp2:0, point2:false, notes:'' },
    { date:'2026-09-03', battle:2, store1:'Kanata Centrum', tpp1:0, point1:false, store2:'Ottawa South', tpp2:0, point2:false, notes:'' },
    { date:'2026-09-03', battle:3, store1:'Pembroke', tpp1:0, point1:false, store2:'Bayshore', tpp2:0, point2:false, notes:'' },
    { date:'2026-09-03', battle:4, store1:'Renfrew', tpp1:0, point1:false, store2:'Baseline', tpp2:0, point2:false, notes:'' },
    { date:'2026-09-03', battle:5, store1:'Carleton Place', tpp1:0, point1:false, store2:'Trainyards', tpp2:0, point2:false, notes:'' }
  ]
};

const els = {
  grid: document.getElementById('battle-grid'),
  leaderboard: document.getElementById('leaderboard'),
  status: document.getElementById('data-status'),
  connectionPill: document.getElementById('connection-pill'),
  connectionText: document.getElementById('connection-text'),
  refresh: document.getElementById('refresh-button')
};

function escapeHTML(input) {
  return String(input ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function value(cell) {
  if (!cell) return '';
  if (cell.f != null) return String(cell.f);
  if (cell.v == null) return '';
  return String(cell.v);
}
function boolish(v) { return String(v).toLowerCase() === 'true'; }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function parseGviz(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('Unexpected Google Sheets response');
  const payload = JSON.parse(text.slice(start, end + 1));
  const rows = payload.table.rows.map(r => (r.c || []).map(value));

  const latestRow = rows.find(r => r[0] === 'STORE_STANDINGS');
  const latestThursday = latestRow?.[6] || fallbackData.latestThursday;
  const currentIndex = rows.findIndex(r => r[0] === 'CURRENT_BATTLES');

  const standings = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] || r[0] === 'CURRENT_BATTLES') break;
    if (/^\d+$/.test(r[0])) standings.push({ storeNo:r[0], store:r[1], points:num(r[2]), rank:num(r[3]) });
  }

  const battles = [];
  if (currentIndex >= 0) {
    for (let i = currentIndex + 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1] || !r[2] || !r[5]) continue;
      battles.push({
        date:r[0], battle:num(r[1]), store1:r[2], tpp1:num(r[3]), point1:boolish(r[4]),
        store2:r[5], tpp2:num(r[6]), point2:boolish(r[7]), notes:r[8] || ''
      });
    }
  }
  if (!standings.length || !battles.length) throw new Error('Scoreboard data was incomplete');
  return { latestThursday, standings, battles };
}

function dateParts(dateString) {
  const d = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { day:'THU', main:dateString, year:'' };
  return {
    day: new Intl.DateTimeFormat('en-CA',{weekday:'short'}).format(d).toUpperCase(),
    main: new Intl.DateTimeFormat('en-CA',{month:'short',day:'numeric'}).format(d).toUpperCase(),
    year: String(d.getFullYear())
  };
}
function prettyDate(dateString) {
  const d = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(d);
}
function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA',{hour:'numeric',minute:'2-digit'}).format(date);
}
function isFinal(b) { return b.point1 || b.point2 || b.tpp1 !== 0 || b.tpp2 !== 0; }
function scoreMarkup(score, complete) {
  return complete
    ? `<span class="score-value">${Number(score).toFixed(1)}</span><span class="score-unit">TPP</span>`
    : `<span class="score-value tbd">TBD</span>`;
}
function trophyBadge() {
  return `<span class="point-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v3h4v3c0 3.2-2 5.4-5 5.9A6 6 0 0 1 13 18v2h4v2H7v-2h4v-2a6 6 0 0 1-3-3.1C5 14.4 3 12.2 3 9V6h4V3Zm10 5v4.6c1.2-.5 2-1.7 2-3.6V8h-2ZM5 8v1c0 1.9.8 3.1 2 3.6V8H5Z"/></svg>+1 Point</span>`;
}

function renderBattles(battles) {
  const sorted = [...battles].sort((a,b) => a.battle - b.battle);
  els.grid.innerHTML = sorted.map((b, index) => {
    const complete = isFinal(b);
    const state = complete ? 'Final' : 'Scheduled';
    const featured = sorted.length % 2 === 1 && index === sorted.length - 1 ? ' featured' : '';
    return `<article class="battle-card${featured}">
      <div class="battle-topbar">
        <span class="battle-number">Battle ${String(b.battle).padStart(2,'0')}</span>
        <span class="battle-state ${complete ? 'final' : ''}">${state}</span>
      </div>
      <div class="matchup">
        <div class="store-side ${b.point1 ? 'winner' : ''}">
          <span class="store-label">Store A</span>
          <div class="store-name">${escapeHTML(b.store1)}</div>
          <div class="score-line">${scoreMarkup(b.tpp1,complete)}</div>
          ${b.point1 ? trophyBadge() : ''}
        </div>
        <div class="vs"><span>VS</span></div>
        <div class="store-side right ${b.point2 ? 'winner' : ''}">
          <span class="store-label">Store B</span>
          <div class="store-name">${escapeHTML(b.store2)}</div>
          <div class="score-line">${scoreMarkup(b.tpp2,complete)}</div>
          ${b.point2 ? trophyBadge() : ''}
        </div>
      </div>
      ${b.notes ? `<p class="battle-note">${escapeHTML(b.notes)}</p>` : ''}
    </article>`;
  }).join('');
}

function renderStandings(rows) {
  const sorted = [...rows].sort((a,b) => a.rank - b.rank || b.points - a.points || a.store.localeCompare(b.store));
  els.leaderboard.innerHTML = sorted.map(s => `
    <div class="leader-row ${s.rank === 1 ? 'top' : ''}">
      <div class="rank-wrap"><div class="rank">${s.rank}</div><svg class="crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l5 4 4-7 4 7 5-4-2 12H5L3 6Zm3.2 10h11.6l.8-5-3.2 2.5L12 8l-3.4 5.5L5.4 11l.8 5Z"/></svg></div>
      <div class="store-info"><strong>${escapeHTML(s.store)}</strong><span>Walmart Store ${escapeHTML(s.storeNo)}</span></div>
      <div class="points">${s.points}<small>${s.points === 1 ? 'point' : 'points'}</small></div>
    </div>`).join('');
}

function leaderSummary(rows) {
  const topPoints = Math.max(...rows.map(r => Number(r.points) || 0));
  const leaders = rows.filter(r => (Number(r.points) || 0) === topPoints).map(r => r.store);
  if (leaders.length === 1) return `${leaders[0]} · ${topPoints} pt${topPoints === 1 ? '' : 's'}`;
  return `${leaders.length} stores tied · ${topPoints} pt${topPoints === 1 ? '' : 's'}`;
}

function render(data, live) {
  const parts = dateParts(data.latestThursday);
  document.getElementById('date-day').textContent = parts.day;
  document.getElementById('date-main').textContent = parts.main;
  document.getElementById('date-year').textContent = parts.year;
  document.getElementById('battle-count').textContent = data.battles.length;
  document.getElementById('store-count').textContent = data.standings.length;
  document.getElementById('leader-summary').textContent = leaderSummary(data.standings);
  document.getElementById('sync-time').textContent = formatTime();
  renderBattles(data.battles);
  renderStandings(data.standings);

  els.status.textContent = live
    ? `Live scoreboard · ${prettyDate(data.latestThursday)}`
    : `Saved scoreboard · ${prettyDate(data.latestThursday)}`;
  els.connectionPill.classList.toggle('live', live);
  els.connectionPill.classList.toggle('saved', !live);
  els.connectionText.textContent = live ? 'Live Google Sheet' : 'Saved copy';
}

async function loadScoreboard() {
  els.refresh.classList.add('loading');
  els.refresh.disabled = true;
  els.connectionText.textContent = 'Connecting…';
  els.status.textContent = 'Loading scoreboard…';
  try {
    const res = await fetch(`${GVIZ_URL}&_=${Date.now()}`, { cache:'no-store' });
    if (!res.ok) throw new Error(`Google Sheets returned ${res.status}`);
    const data = parseGviz(await res.text());
    render(data,true);
  } catch (err) {
    console.warn('Live scoreboard unavailable, using saved data.',err);
    render(fallbackData,false);
  } finally {
    els.refresh.classList.remove('loading');
    els.refresh.disabled = false;
  }
}

els.refresh.addEventListener('click',loadScoreboard);
loadScoreboard();
