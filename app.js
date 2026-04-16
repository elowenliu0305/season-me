/* =========================================================
   SEASON ME · SEE MYSELF · app.js
   ========================================================= */

'use strict';

/* =========================================================
   Plausible event helper
   ========================================================= */
function trackEvent(name) {
  try {
    if (window.plausible) window.plausible(name);
  } catch { /* ad blockers may block plausible */ }
}

/* =========================================================
   1.7 localStorage utility
   ========================================================= */
const smse = {
  get(key) {
    try { return localStorage.getItem('smse_' + key); } catch { return null; }
  },
  getJSON(key) {
    try { return JSON.parse(localStorage.getItem('smse_' + key)); } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem('smse_' + key, val); }
    catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        showToast('存储空间不足，部分数据可能无法保存');
      }
      console.warn('localStorage write failed', e);
    }
  },
  setJSON(key, val) {
    try { localStorage.setItem('smse_' + key, JSON.stringify(val)); }
    catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        showToast('存储空间不足，部分数据可能无法保存');
      }
      console.warn('localStorage write failed', e);
    }
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('smse_'))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
  remove(key) {
    try { localStorage.removeItem('smse_' + key); } catch { /* ignore */ }
  },
  getUsage() {
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith('smse_'))
        .reduce((sum, k) => sum + (localStorage.getItem(k) || '').length * 2, 0);
    } catch { return 0; }
  }
};

/* =========================================================
   PipelineClient — SSE-based analysis pipeline
   ========================================================= */
const PipelineClient = {
  _running: false,
  _result: null,
  _progressCallbacks: [],
  _doneCallbacks: [],
  _errorCallbacks: [],

  onProgress(cb) { this._progressCallbacks.push(cb); },
  onDone(cb) { this._doneCallbacks.push(cb); },
  onError(cb) { this._errorCallbacks.push(cb); },

  _emit(type, data) {
    (type === 'progress' ? this._progressCallbacks : type === 'done' ? this._doneCallbacks : this._errorCallbacks)
      .forEach(cb => { try { cb(data); } catch {} });
  },

  getCachedResult() {
    return smse.getJSON('pipelineResult');
  },

  start() {
    if (this._running) return;
    const cached = this.getCachedResult();
    if (cached) {
      this._result = cached;
      setTimeout(() => this._emit('done', cached), 0);
      return;
    }

    const photo = smse.get('photo');
    const body = {
      quizAnswers: smse.getJSON('quiz') || [],
      nickname: smse.get('nickname') || '',
      spirit: smse.get('spirit') || '',
      image: photo || '',
    };

    this._running = true;
    fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processChunk(chunk) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let event = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (event === 'progress') PipelineClient._emit('progress', data);
            else if (event === 'step_result') PipelineClient._stepResults = PipelineClient._stepResults || {};
            else if (event === 'step_error') {
              console.warn('Pipeline step error:', data);
            }
            else if (event === 'done') {
              PipelineClient._result = data;
              PipelineClient._running = false;
              smse.setJSON('pipelineResult', data);
              PipelineClient._emit('done', data);
            } else if (event === 'error') {
              PipelineClient._running = false;
              PipelineClient._emit('error', data);
            }
            event = '';
          }
        }
      }

      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) { PipelineClient._running = false; return; }
          processChunk(decoder.decode(value, { stream: true }));
          return pump();
        });
      }

      return pump();
    }).catch(err => {
      this._running = false;
      this._emit('error', { error: err.message });
    });
  },

  getResult() { return this._result; },
  isRunning() { return this._running; },
  reset() {
    this._running = false;
    this._result = null;
    this._stepResults = null;
    smse.remove('pipelineResult');
  },
};

/* =========================================================
   1.5 ThemeManager — 12 seasons
   ========================================================= */
class ThemeManager {
  static THEMES = {
    'bright-spring': {
      '--base-bg': '#FFF5E4', '--accent-color': '#F4A261', '--text-main': '#7B2D00',
      '--text-secondary': '#A0522D', '--spirit-color': '#F4A261',
      '--glow-color': 'rgba(244,162,97,0.35)',
      '--palette-1': '#FFD166', '--palette-2': '#F4A261', '--palette-3': '#E76F51',
      '--palette-4': '#FFEDD8', '--palette-5': '#FAB95B',
    },
    'warm-spring': {
      '--base-bg': '#FDF3E7', '--accent-color': '#E07A5F', '--text-main': '#5C2B0A',
      '--text-secondary': '#8B4513', '--spirit-color': '#E07A5F',
      '--glow-color': 'rgba(224,122,95,0.35)',
      '--palette-1': '#E07A5F', '--palette-2': '#F2CC8F', '--palette-3': '#81B29A',
      '--palette-4': '#F4F1DE', '--palette-5': '#C1666B',
    },
    'light-spring': {
      '--base-bg': '#FEFAF0', '--accent-color': '#F6BD60', '--text-main': '#5C4827',
      '--text-secondary': '#8B7355', '--spirit-color': '#F6BD60',
      '--glow-color': 'rgba(246,189,96,0.35)',
      '--palette-1': '#F6BD60', '--palette-2': '#F7EDE2', '--palette-3': '#84A98C',
      '--palette-4': '#FCEACC', '--palette-5': '#D4C5A9',
    },
    'light-summer': {
      '--base-bg': '#EEF2F7', '--accent-color': '#A8C5DA', '--text-main': '#2C3E5A',
      '--text-secondary': '#5C7A9A', '--spirit-color': '#A8C5DA',
      '--glow-color': 'rgba(168,197,218,0.4)',
      '--palette-1': '#A8C5DA', '--palette-2': '#C8D8E8', '--palette-3': '#8EAFC8',
      '--palette-4': '#E8F0F8', '--palette-5': '#B8C8D8',
    },
    'cool-summer': {
      '--base-bg': '#EEE9F0', '--accent-color': '#9B8FAE', '--text-main': '#2C2040',
      '--text-secondary': '#6B5F7A', '--spirit-color': '#9B8FAE',
      '--glow-color': 'rgba(155,143,174,0.35)',
      '--palette-1': '#D4C5E2', '--palette-2': '#B8AAC8', '--palette-3': '#8E7FA0',
      '--palette-4': '#F2EDF7', '--palette-5': '#E8DFF0',
    },
    'soft-summer': {
      '--base-bg': '#F0EDE8', '--accent-color': '#B5A8A0', '--text-main': '#3A3028',
      '--text-secondary': '#7A6E68', '--spirit-color': '#B5A8A0',
      '--glow-color': 'rgba(181,168,160,0.35)',
      '--palette-1': '#C8B8B0', '--palette-2': '#D8CCC5', '--palette-3': '#A89890',
      '--palette-4': '#EDE8E3', '--palette-5': '#BDB0A8',
    },
    'warm-autumn': {
      '--base-bg': '#F5EBD8', '--accent-color': '#C4762A', '--text-main': '#3D2000',
      '--text-secondary': '#7A4A10', '--spirit-color': '#C4762A',
      '--glow-color': 'rgba(196,118,42,0.35)',
      '--palette-1': '#C4762A', '--palette-2': '#E8A458', '--palette-3': '#8B5E1A',
      '--palette-4': '#F5E0C0', '--palette-5': '#D4903A',
    },
    'deep-autumn': {
      '--base-bg': '#EDE0CE', '--accent-color': '#8B4513', '--text-main': '#2D1200',
      '--text-secondary': '#6B3010', '--spirit-color': '#8B4513',
      '--glow-color': 'rgba(139,69,19,0.35)',
      '--palette-1': '#8B4513', '--palette-2': '#CD853F', '--palette-3': '#A0522D',
      '--palette-4': '#DEB887', '--palette-5': '#6B3A2A',
    },
    'soft-autumn': {
      '--base-bg': '#F0E8DC', '--accent-color': '#B87D5A', '--text-main': '#3D2B1A',
      '--text-secondary': '#7A5540', '--spirit-color': '#B87D5A',
      '--glow-color': 'rgba(184,125,90,0.35)',
      '--palette-1': '#B87D5A', '--palette-2': '#D4A882', '--palette-3': '#C8967A',
      '--palette-4': '#E8D5C0', '--palette-5': '#A06848',
    },
    'deep-winter': {
      '--base-bg': '#E8E0F0', '--accent-color': '#4A0080', '--text-main': '#100020',
      '--text-secondary': '#3A0060', '--spirit-color': '#4A0080',
      '--glow-color': 'rgba(74,0,128,0.35)',
      '--palette-1': '#4A0080', '--palette-2': '#800080', '--palette-3': '#2D0050',
      '--palette-4': '#C8A0E0', '--palette-5': '#6A20A0',
    },
    'cool-winter': {
      '--base-bg': '#E0E8F0', '--accent-color': '#1A4A8A', '--text-main': '#080C20',
      '--text-secondary': '#2A3A6A', '--spirit-color': '#1A4A8A',
      '--glow-color': 'rgba(26,74,138,0.35)',
      '--palette-1': '#1A4A8A', '--palette-2': '#3A6AAA', '--palette-3': '#0A2A5A',
      '--palette-4': '#A0C0E0', '--palette-5': '#2A5A9A',
    },
    'bright-winter': {
      '--base-bg': '#EAF0F8', '--accent-color': '#0055CC', '--text-main': '#000F30',
      '--text-secondary': '#1A3A7A', '--spirit-color': '#0055CC',
      '--glow-color': 'rgba(0,85,204,0.35)',
      '--palette-1': '#0055CC', '--palette-2': '#FF2060', '--palette-3': '#00AAEE',
      '--palette-4': '#CCE0FF', '--palette-5': '#5588DD',
    },
  };

  // Spirit → preview glow color (before season is determined)
  static SPIRIT_GLOWS = {
    swan:      'rgba(200,185,220,0.45)',
    leopard:   'rgba(200,140,60,0.45)',
    butterfly: 'rgba(180,100,180,0.45)',
    cat:       'rgba(160,140,130,0.45)',
    peacock:   'rgba(0,160,150,0.45)',
    deer:      'rgba(180,150,110,0.45)',
    fox:       'rgba(210,110,50,0.45)',
    iris:      'rgba(100,80,180,0.45)',
    wolf:      'rgba(120,130,150,0.45)',
    rose:      'rgba(220,80,100,0.45)',
    owl:       'rgba(140,110,80,0.45)',
    tiger:     'rgba(220,140,40,0.45)',
    dolphin:   'rgba(60,160,210,0.45)',
    crane:     'rgba(200,210,220,0.45)',
    moon:      'rgba(160,150,200,0.45)',
    flame:     'rgba(230,100,50,0.45)',
    rabbit:    'rgba(220,180,200,0.45)',
    bear:      'rgba(140,100,60,0.45)',
    panda:     'rgba(150,150,150,0.45)',
    koala:     'rgba(180,170,150,0.45)',
    lion:      'rgba(210,170,50,0.45)',
    penguin:   'rgba(60,60,80,0.45)',
    eagle:     'rgba(160,130,80,0.45)',
    flamingo:  'rgba(230,130,170,0.45)',
    unicorn:   'rgba(200,150,220,0.45)',
    dragon:    'rgba(100,180,80,0.45)',
    horse:     'rgba(160,120,80,0.45)',
    elephant:  'rgba(160,150,140,0.45)',
    whale:     'rgba(60,100,180,0.45)',
    turtle:    'rgba(80,160,100,0.45)',
    frog:      'rgba(80,180,80,0.45)',
    bee:       'rgba(220,180,50,0.45)',
    ladybug:   'rgba(200,60,60,0.45)',
    snail:     'rgba(180,160,130,0.45)',
    hedgehog:  'rgba(170,140,100,0.45)',
    otter:     'rgba(140,120,90,0.45)',
    bat:       'rgba(100,80,120,0.45)',
    parrot:    'rgba(60,180,60,0.45)',
    octopus:   'rgba(160,60,180,0.45)',
    fish:      'rgba(60,180,200,0.45)',
    shell:     'rgba(240,200,170,0.45)',
    mushroom:  'rgba(180,60,60,0.45)',
    sunflower: 'rgba(230,190,50,0.45)',
    tulip:     'rgba(220,100,120,0.45)',
    hibiscus:  'rgba(220,80,130,0.45)',
    sun:       'rgba(240,200,60,0.45)',
    cloud:     'rgba(180,200,220,0.45)',
    snowflake: 'rgba(150,200,240,0.45)',
    sparkles:  'rgba(220,200,100,0.45)',
    star:      'rgba(220,200,60,0.45)',
    heart:     'rgba(220,60,80,0.45)',
    diamond:   'rgba(120,180,240,0.45)',
    crown:     'rgba(220,190,50,0.45)',
    clover:    'rgba(80,180,80,0.45)',
    cactus:    'rgba(80,160,80,0.45)',
    leaf:      'rgba(100,180,80,0.45)',
    feather:   'rgba(180,170,150,0.45)',
    rainbow:   'rgba(200,140,200,0.45)',
    wave:      'rgba(60,140,200,0.45)',
    snowman:   'rgba(180,210,230,0.45)',
  };

  static apply(seasonId) {
    const theme = ThemeManager.THEMES[seasonId] || ThemeManager.THEMES['cool-summer'];
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';

    Object.entries(theme).forEach(([k, v]) => {
      if (isDark) {
        if (k === '--base-bg') v = '#0F0F0F';
        if (k === '--text-main') v = '#E8E8E8';
        if (k === '--text-secondary') v = '#9A9A9A';
      }
      root.style.setProperty(k, v);
    });
  }

  static getPreviewGlow(spiritId) {
    return ThemeManager.SPIRIT_GLOWS[spiritId] || 'rgba(150,150,150,0.35)';
  }
}

/* =========================================================
   1.6 Page router
   ========================================================= */
const PAGES = ['cover', 'identity', 'quiz', 'sampling', 'darkroom', 'story', 'export', 'community'];
let currentPage = 'cover';

function showPage(pageId, direction = 'forward') {
  const current = document.getElementById('page-' + currentPage);
  const next = document.getElementById('page-' + pageId);
  if (!next || pageId === currentPage) return;

  const fromX = direction === 'forward' ? '100%' : '-100%';
  const toX   = direction === 'forward' ? '-100%' : '100%';

  next.style.display = 'block';
  next.style.transform = `translateX(${fromX})`;

  const duration = 400;
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

  next.animate([
    { transform: `translateX(${fromX})` },
    { transform: 'translateX(0)' }
  ], { duration, easing, fill: 'forwards' });

  if (current) {
    current.animate([
      { transform: 'translateX(0)' },
      { transform: `translateX(${toX})` }
    ], { duration, easing, fill: 'forwards' }).onfinish = () => {
      current.style.display = 'none';
      current.removeAttribute('data-active');
      current.style.transform = '';
    };
  }

  next.setAttribute('data-active', 'true');
  currentPage = pageId;

  // Lifecycle hooks
  if (pageId === 'identity') initIdentityPage();
  if (pageId === 'quiz') initQuizPage();
  if (pageId === 'sampling') initSamplingPage();
  if (pageId === 'darkroom') initDarkroomPage();
  if (pageId === 'story') initStoryPage();
  if (pageId === 'export') initExportPage();
  if (pageId === 'community') initCommunityPage();
}

/* =========================================================
   SVG SPIRITS DATA
   ========================================================= */
const SPIRITS = {
  swan:      { label: 'Swan',      emoji: '🦢' },
  leopard:   { label: 'Leopard',   emoji: '🐆' },
  butterfly: { label: 'Butterfly', emoji: '🦋' },
  cat:       { label: 'Cat',       emoji: '🐱' },
  peacock:   { label: 'Peacock',   emoji: '🦚' },
  deer:      { label: 'Deer',      emoji: '🦌' },
  fox:       { label: 'Fox',       emoji: '🦊' },
  iris:      { label: 'Iris',      emoji: '🌸' },
  wolf:      { label: 'Wolf',      emoji: '🐺' },
  rose:      { label: 'Rose',      emoji: '🌹' },
  owl:       { label: 'Owl',       emoji: '🦉' },
  tiger:     { label: 'Tiger',     emoji: '🐯' },
  dolphin:   { label: 'Dolphin',   emoji: '🐬' },
  crane:     { label: 'Crane',     emoji: '🕊️' },
  moon:      { label: 'Moon',      emoji: '🌙' },
  flame:     { label: 'Flame',     emoji: '🔥' },
  rabbit:    { label: 'Rabbit',    emoji: '🐰' },
  bear:      { label: 'Bear',      emoji: '🐻' },
  panda:     { label: 'Panda',     emoji: '🐼' },
  koala:     { label: 'Koala',     emoji: '🐨' },
  lion:      { label: 'Lion',      emoji: '🦁' },
  penguin:   { label: 'Penguin',   emoji: '🐧' },
  eagle:     { label: 'Eagle',     emoji: '🦅' },
  flamingo:  { label: 'Flamingo',  emoji: '🦩' },
  unicorn:   { label: 'Unicorn',   emoji: '🦄' },
  dragon:    { label: 'Dragon',    emoji: '🐉' },
  horse:     { label: 'Horse',     emoji: '🐴' },
  elephant:  { label: 'Elephant',  emoji: '🐘' },
  whale:     { label: 'Whale',     emoji: '🐋' },
  turtle:    { label: 'Turtle',    emoji: '🐢' },
  frog:      { label: 'Frog',      emoji: '🐸' },
  bee:       { label: 'Bee',       emoji: '🐝' },
  ladybug:   { label: 'Ladybug',   emoji: '🐞' },
  snail:     { label: 'Snail',     emoji: '🐌' },
  hedgehog:  { label: 'Hedgehog',  emoji: '🦔' },
  otter:     { label: 'Otter',     emoji: '🦦' },
  bat:       { label: 'Bat',       emoji: '🦇' },
  parrot:    { label: 'Parrot',    emoji: '🦜' },
  octopus:   { label: 'Octopus',   emoji: '🐙' },
  fish:      { label: 'Fish',      emoji: '🐠' },
  shell:     { label: 'Shell',     emoji: '🐚' },
  mushroom:  { label: 'Mushroom',  emoji: '🍄' },
  sunflower: { label: 'Sunflower', emoji: '🌻' },
  tulip:     { label: 'Tulip',     emoji: '🌷' },
  hibiscus:  { label: 'Hibiscus',  emoji: '🌺' },
  sun:       { label: 'Sun',       emoji: '☀️' },
  cloud:     { label: 'Cloud',     emoji: '☁️' },
  snowflake: { label: 'Snowflake', emoji: '❄️' },
  sparkles:  { label: 'Sparkles', emoji: '✨' },
  star:      { label: 'Star',      emoji: '⭐' },
  heart:     { label: 'Heart',     emoji: '❤️' },
  diamond:   { label: 'Diamond',   emoji: '💎' },
  crown:     { label: 'Crown',     emoji: '👑' },
  clover:    { label: 'Clover',    emoji: '🍀' },
  cactus:    { label: 'Cactus',    emoji: '🌵' },
  leaf:      { label: 'Leaf',      emoji: '🍃' },
  feather:   { label: 'Feather',   emoji: '🪶' },
  rainbow:   { label: 'Rainbow',   emoji: '🌈' },
  wave:      { label: 'Wave',      emoji: '🌊' },
  snowman:   { label: 'Snowman',   emoji: '⛄' },
};

/* =========================================================
   PAGE 1 · COVER — mixed-scale brand lockup animation
   ========================================================= */
function initCoverPage() {
  const container = document.getElementById('brandLetters');
  container.innerHTML = '';

  // Build the lockup: SEASON (stacked letters) · rule · ME · tagline
  const lockup = document.createElement('div');
  lockup.className = 'brand-lockup';

  // SEASON — each letter stacked
  const seasonRow = document.createElement('div');
  seasonRow.className = 'brand-word-season';
  const easing = 'cubic-bezier(0.4,0,0.2,1)';
  let delay = 0;

  [...'SEASON'].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'brand-letter';
    span.textContent = ch;
    seasonRow.appendChild(span);
    span.animate([
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 500, delay: delay, easing, fill: 'forwards' });
    delay += 55;
  });

  lockup.appendChild(seasonRow);

  // Thin rule
  const rule = document.createElement('div');
  rule.className = 'brand-rule';
  lockup.appendChild(rule);
  rule.animate([
    { opacity: 0, transform: 'scaleX(0)' },
    { opacity: 1, transform: 'scaleX(1)' }
  ], { duration: 400, delay: delay, easing, fill: 'forwards' });
  delay += 120;

  // ME
  const meEl = document.createElement('span');
  meEl.className = 'brand-word-me';
  meEl.textContent = 'ME';
  lockup.appendChild(meEl);
  meEl.animate([
    { opacity: 0, transform: 'translateY(24px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 600, delay: delay, easing, fill: 'forwards' });
  delay += 200;

  // · see myself ·
  const tagSub = document.createElement('span');
  tagSub.className = 'brand-tagline-sub';
  tagSub.textContent = '· see myself ·';
  lockup.appendChild(tagSub);
  tagSub.animate([
    { opacity: 0 },
    { opacity: 1 }
  ], { duration: 600, delay: delay, easing, fill: 'forwards' });

  container.appendChild(lockup);

  document.getElementById('btnStart').onclick = () => showPage('identity');
  document.getElementById('btnCommunity').onclick = () => showPage('community');
}

/* 2.4 Font load fallback */
(function handleFontFallback() {
  const timeout = setTimeout(() => {
    document.body.style.fontFamily = 'Georgia, serif';
  }, 4000);
  document.fonts.ready.then(() => clearTimeout(timeout));
})();

/* =========================================================
   PAGE 2 · IDENTITY SETUP (tasks 3.1–3.7)
   ========================================================= */
function initIdentityPage() {
  // 3.1 header already in HTML
  const input = document.getElementById('inputNickname');
  const hint  = document.getElementById('nicknameHint');

  // 3.6 Restore saved values
  const saved = smse.get('nickname');
  if (saved) input.value = saved;

  input.addEventListener('input', () => {
    smse.set('nickname', input.value.trim());
    hint.classList.remove('visible');
  });

  // 3.3 Build spirit grid
  buildSpiritGrid();

  // 3.5 Avatar upload
  const fileInput = document.getElementById('avatarFileInput');
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) processAvatarUpload(file);
  });
  document.getElementById('avatarUploadLabel').addEventListener('click', () => fileInput.click());

  // 3.7 NEXT button
  const btnNext = document.getElementById('btnIdentityNext');
  btnNext.onclick = () => {
    const name = (document.getElementById('inputNickname').value || '').trim();
    if (!name) {
      hint.classList.add('visible');
      document.getElementById('inputNickname').focus();
      return;
    }
    smse.set('nickname', name);
    trackEvent('QuizStarted');
    showPage('quiz');
  };
}

function buildSpiritGrid() {
  const grid = document.getElementById('spiritGrid');
  grid.innerHTML = '';
  const savedSpirit = smse.get('spirit');

  Object.entries(SPIRITS).forEach(([id, data]) => {
    const item = document.createElement('div');
    item.className = 'spirit-item' + (savedSpirit === id ? ' selected' : '');
    item.dataset.id = id;
    item.innerHTML = `
      <span class="spirit-emoji">${data.emoji}</span>
      <span class="spirit-label-text">${data.label}</span>
    `;

    if (savedSpirit === id) {
      item.style.boxShadow = `0 0 0 5px ${ThemeManager.getPreviewGlow(id)}`;
    }

    item.addEventListener('click', () => {
      document.querySelectorAll('.spirit-item').forEach(el => {
        el.classList.remove('selected');
        el.style.boxShadow = '';
      });
      item.classList.add('selected');
      item.style.boxShadow = `0 0 0 5px ${ThemeManager.getPreviewGlow(id)}`;
      smse.set('spirit', id);
    });

    grid.appendChild(item);
  });
}

/* 3.5 Avatar canvas processing */
function processAvatarUpload(file, quality = 0.8) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('avatarCanvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      // Circle clip
      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, Math.PI * 2);
      ctx.clip();
      // Center crop
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      // Check size (~50KB limit for avatar)
      const kb = Math.round((dataUrl.length * 3/4) / 1024);
      if (kb > 50 && quality > 0.4) {
        processAvatarUpload(file, quality - 0.2);
        return;
      }
      smse.set('avatar', dataUrl);
      document.getElementById('avatarUploadText').textContent = '✓ Custom avatar saved';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* =========================================================
   PAGE 3 · AESTHETIC QUIZ (tasks 4.1–4.6)
   ========================================================= */

// 4.1 Quiz data
const QUIZ_DATA = [
  {
    q: '走进空屋，第一眼希望看到？',
    options: ['极简留白', '秩序画廊', '复古沙龙', '原始自然'],
    images: ['images/IMG_0924.jpg', 'images/IMG_0925.jpg', 'images/IMG_0926.jpg', 'images/IMG_0927.jpg'],
    positions: ['center 70%', 'center 70%', 'center 70%', 'center'],
    dims: [
      { E: 0.8, O: 0.8 }, { E: 0.6, O: 0.9 }, { E: 0.4, O: 0.3 }, { E: 0.2, O: 0.2 }
    ]
  },
  {
    q: '哪种材质让你感到最"安全"？',
    options: ['清冷金属', '挺括羊毛', '温暖羊绒', '灵动绸缎'],
    images: ['images/IMG_0928.jpg', 'images/IMG_0929.jpg', 'images/IMG_0930.jpg', 'images/IMG_0931.jpg'],
    dims: [
      { T: -0.8, X: 0.8 }, { T: 0.2, X: 0.9 }, { T: 0.9, X: 0.3 }, { T: 0.4, X: -0.6 }
    ]
  },
  {
    q: '向往哪种"光影氛围"？',
    options: ['黎明晨雾', '高光对比', '落日熔金', '柔焦月光'],
    images: ['images/IMG_0932.jpg', 'images/IMG_0933.jpg', 'images/IMG_0934.jpg', 'images/IMG_0935.jpg'],
    dims: [
      { T: -0.6, E: -0.4 }, { E: 0.9, O: 0.8 }, { T: 0.9, E: 0.6 }, { E: -0.5, T: 0.1 }
    ]
  },
  {
    q: '朋友如何形容你的"气场"？',
    options: ['高山雪水', '建筑线条', '秋日壁炉', '春日繁花'],
    images: ['images/IMG_0936.jpg', 'images/IMG_0937.jpg', 'images/IMG_0938.jpg', 'images/IMG_0939.jpg'],
    dims: [
      { T: -0.8, E: -0.4 }, { O: 0.9, E: 0.2 }, { T: 0.8, E: 0.5 }, { E: 0.7, T: 0.3 }
    ]
  },
  {
    q: '挑一张唱片封面？',
    options: ['黑白主义', '波普艺术', '油画质感', '胶片写真'],
    images: ['images/IMG_0940.jpg', 'images/IMG_0941.jpg', 'images/IMG_0942.jpg', 'images/IMG_0943.jpg'],
    dims: [
      { O: 0.8, E: -0.4 }, { E: 0.9, T: 0.3 }, { T: 0.5, X: -0.4 }, { E: -0.3, T: -0.2 }
    ]
  }
];

let quizAnswers = [];
let currentQuizIndex = 0;

function initQuizPage() {
  // 4.6 Reset answers
  quizAnswers = [];
  currentQuizIndex = 0;
  smse.setJSON('quiz', []);
  renderQuestion(0);
}

// 4.2 Render question
function renderQuestion(index) {
  const data = QUIZ_DATA[index];
  const progEl = document.getElementById('quizProgressNum');
  progEl.textContent = String(index + 1).padStart(2, '0');

  const content = document.getElementById('quizContent');
  content.innerHTML = `
    <div class="quiz-question">${data.q}</div>
    <div class="quiz-options" id="quizOptions"></div>
  `;

  const optGrid = document.getElementById('quizOptions');
  data.options.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    const pos = (data.positions && data.positions[i]) || 'center';
    btn.innerHTML = `
      <div class="quiz-option-bg" style="background-image:url('${data.images[i]}');background-size:cover;background-position:${pos}"></div>
      <div class="quiz-option-label">${label}</div>
    `;

    // 4.3 Greyscale → color on touch
    btn.addEventListener('touchstart', () => btn.classList.add('touched'), { passive: true });
    btn.addEventListener('touchend', () => btn.classList.remove('touched'), { passive: true });
    btn.addEventListener('mouseenter', () => btn.classList.add('touched'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('touched'));

    // 4.4 Answer & advance
    btn.addEventListener('click', () => {
      btn.classList.add('selected');
      quizAnswers[index] = i;
      smse.setJSON('quiz', quizAnswers);

      setTimeout(() => {
        if (index + 1 < QUIZ_DATA.length) {
          // Slide to next question
          slideQuizTo(index + 1);
        } else {
          // 4.5 All done — go to sampling
          showPage('sampling');
        }
      }, 280);
    });

    optGrid.appendChild(btn);
  });
}

function slideQuizTo(nextIndex) {
  const content = document.getElementById('quizContent');
  content.animate([
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(-60px)', opacity: 0 }
  ], { duration: 200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
    currentQuizIndex = nextIndex;
    renderQuestion(nextIndex);
    content.style.transform = 'translateX(60px)';
    content.style.opacity = '0';
    content.animate([
      { transform: 'translateX(60px)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
  };
}

/* =========================================================
   PAGE 4 · VISUAL SAMPLING (tasks 5.1–5.8)
   ========================================================= */
let cameraStream = null;
let capturedDataUrl = null;

function initSamplingPage() {
  capturedDataUrl = null;
  const video     = document.getElementById('cameraVideo');
  const preview   = document.getElementById('photoPreview');
  const btnShutter= document.getElementById('btnShutter');
  const btnRetake = document.getElementById('btnRetake');
  const btnConfirm= document.getElementById('btnConfirm');
  const galleryIn = document.getElementById('galleryInput');
  const captureActions = document.getElementById('captureActions');
  const previewActions = document.getElementById('previewActions');

  // Reset UI
  video.style.display = 'block';
  preview.style.display = 'none';
  captureActions.style.display = '';
  previewActions.style.display = 'none';

  // 5.2 Start camera
  startCamera();

  btnShutter.onclick = capturePhoto;

  // 5.5 Gallery
  galleryIn.onchange = e => {
    const file = e.target.files[0];
    if (file) loadImageFromFile(file);
  };

  // 5.7 Retake
  btnRetake.onclick = () => {
    capturedDataUrl = null;
    preview.style.display = 'none';
    video.style.display = 'block';
    captureActions.style.display = '';
    previewActions.style.display = 'none';
    // Reset gallery input so same file can be reselected
    galleryIn.value = '';
    startCamera();
    btnShutter.onclick = capturePhoto;
  };

  // 5.8 Confirm
  btnConfirm.onclick = () => {
    if (!capturedDataUrl) return;
    processAndSavePhoto(capturedDataUrl);
  };
}

async function startCamera() {
  stopCamera();
  const video = document.getElementById('cameraVideo');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      audio: false
    });
    video.srcObject = cameraStream;
  } catch {
    // 5.4 Degrade gracefully — hide capture button, show placeholder
    video.style.display = 'none';
    const shutter = document.getElementById('btnShutter');
    if (shutter) shutter.style.display = 'none';
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('photoCanvas');
  const size = Math.min(video.videoWidth, video.videoHeight) || 640;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const sx = (video.videoWidth - size) / 2;
  const sy = (video.videoHeight - size) / 2;
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
  capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
  showPhotoPreview(capturedDataUrl);
  stopCamera();
}

function loadImageFromFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    capturedDataUrl = e.target.result;
    showPhotoPreview(capturedDataUrl);
    stopCamera();
  };
  reader.readAsDataURL(file);
}

function showPhotoPreview(dataUrl) {
  const video   = document.getElementById('cameraVideo');
  const preview = document.getElementById('photoPreview');
  const captureActions = document.getElementById('captureActions');
  const previewActions = document.getElementById('previewActions');

  video.style.display = 'none';
  preview.src = dataUrl;
  preview.style.display = 'block';
  // Polaroid animation
  preview.classList.remove('polaroid-enter', 'clear');
  void preview.offsetWidth;
  preview.classList.add('polaroid-enter');
  requestAnimationFrame(() => {
    setTimeout(() => preview.classList.add('clear'), 50);
  });

  captureActions.style.display = 'none';
  previewActions.style.display = '';
}

// 5.6 Crop center square + compress
function processAndSavePhoto(dataUrl, quality = 0.7) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.getElementById('photoCanvas');
    const size = 640;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const s = Math.min(img.width, img.height);
    const sx = (img.width - s) / 2;
    const sy = (img.height - s) / 2;
    ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
    const result = canvas.toDataURL('image/jpeg', quality);
    const kb = Math.round((result.length * 3/4) / 1024);
    if (kb > 200 && quality > 0.3) {
      processAndSavePhoto(dataUrl, quality - 0.15);
      return;
    }
    if (kb > 3072) {
      showToast('照片较大，可能占用较多存储空间');
    }
    PipelineClient.reset();
    smse.set('photo', result);
    stopCamera();
    showPage('darkroom');
  };
  img.src = dataUrl;
}

/* =========================================================
   PAGE 5 · DARKROOM (tasks 6.1–6.5)
   ========================================================= */
function initDarkroomPage() {
  const output   = document.getElementById('typewriterOutput');
  const complete = document.getElementById('analysisComplete');
  output.textContent = '';
  complete.classList.remove('visible');

  PipelineClient.reset();

  PipelineClient.onProgress(({ step, message }) => {
    if (step > 1) output.textContent += '\n';
    typewriter(message, output, 55);
  });

  PipelineClient.onDone((result) => {
    setTimeout(() => {
      complete.classList.add('visible');
      setTimeout(() => {
        trackEvent('QuizCompleted');
        showPage('story');
      }, 900);
    }, 500);
  });

  PipelineClient.onError(({ error }) => {
    complete.classList.add('visible');
    setTimeout(() => showPage('story'), 900);
  });

  PipelineClient.start();
}

function typewriter(text, el, speed = 60) {
  return new Promise(resolve => {
    let i = 0;
    const line = document.createElement('div');
    el.appendChild(line);
    const interval = setInterval(() => {
      line.textContent += text[i++];
      if (i >= text.length) { clearInterval(interval); resolve(); }
    }, speed);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* =========================================================
   SEASON META (static display data)
   ========================================================= */
const SEASON_META = {
  'bright-spring': {
    zh: '明亮春', en: 'BRIGHT SPRING',
    keywords: ['VIVID · WARM · CLEAR'],
    copy: '你天生拥有令人眼前一亮的明媚气场。暖金色与珊瑚色是你的主场，高饱和的色彩在你身上不显张扬，反而熠熠生辉。',
  },
  'warm-spring': {
    zh: '暖春', en: 'WARM SPRING',
    keywords: ['WARM · FRESH · GOLDEN'],
    copy: '你是春日午后最温柔的那束光。象牙白、蜜桃与苔绿相伴，赋予你一种天然的亲和力与生命力。',
  },
  'light-spring': {
    zh: '柔春', en: 'LIGHT SPRING',
    keywords: ['SOFT · WARM · DELICATE'],
    copy: '你的美轻盈如初春薄雾，粉彩与米金是天生的伙伴。过于沉重的色彩会遮掩你与生俱来的清透感。',
  },
  'light-summer': {
    zh: '柔夏', en: 'LIGHT SUMMER',
    keywords: ['COOL · LIGHT · AIRY'],
    copy: '你的气质如冰蓝天空般开阔纯净。粉灰与薰衣草是你最好的朋友，让你散发宁静又不失存在感的魅力。',
  },
  'cool-summer': {
    zh: '冷夏', en: 'COOL SUMMER',
    keywords: ['COOL · MUTED · ELEGANT'],
    copy: '你天生自带一种精准的克制美学。莫兰迪色系与你高度契合，低调的冷调色彩让你显得格外有品位与深度。',
  },
  'soft-summer': {
    zh: '优雅夏', en: 'SOFT SUMMER',
    keywords: ['SOFT · COOL · REFINED'],
    copy: '你的美是经过时间沉淀的成熟与温柔。玫瑰灰、蓝灰与粉紫为你构建出一种无可复制的优雅质感。',
  },
  'warm-autumn': {
    zh: '暖秋', en: 'WARM AUTUMN',
    keywords: ['WARM · RICH · EARTHY'],
    copy: '你自带焦糖色的慵懒气场。大地色系是你的舒适区，橄榄绿、赤陶与锈橙在你身上演绎着最地道的自然奢华。',
  },
  'deep-autumn': {
    zh: '深秋', en: 'DEEP AUTUMN',
    keywords: ['DEEP · WARM · DRAMATIC'],
    copy: '你的气场深邃而有分量。深棕、酒红与墨绿赋予你一种压迫感十足的高级感，浅淡色彩反而会稀释你的魅力。',
  },
  'soft-autumn': {
    zh: '柔秋', en: 'SOFT AUTUMN',
    keywords: ['MUTED · WARM · ORGANIC'],
    copy: '你的美如同秋日午后的暖光——柔和却回味无穷。驼色、粉棕与锈金是你最温柔的表达方式。',
  },
  'deep-winter': {
    zh: '深冬', en: 'DEEP WINTER',
    keywords: ['DEEP · COOL · BOLD'],
    copy: '你天生拥有让人过目不忘的强烈存在感。黑与白是你最锋利的武器，宝蓝与酒红更能将你的气场拉满。',
  },
  'cool-winter': {
    zh: '冷冬', en: 'COOL WINTER',
    keywords: ['COOL · CLEAR · SHARP'],
    copy: '你的美有一种冷冽的穿透力。冰蓝、银白与钢灰让你显得干净而锐利，这是一种需要勇气才能驾驭的美。',
  },
  'bright-winter': {
    zh: '明亮冬', en: 'BRIGHT WINTER',
    keywords: ['VIVID · COOL · STRIKING'],
    copy: '你是冬日里最耀眼的那道光。高饱和的冷色——品蓝、品红与翠绿——天然属于你，让你在人群中无法被忽视。',
  },
};

/* =========================================================
   PAGE 6 · FEATURE STORY
   ========================================================= */
function initStoryPage() {
  const result = PipelineClient.getResult() || PipelineClient.getCachedResult();
  const season = (result && result.season) || smse.get('season') || 'cool-summer';

  // Apply theme and save season
  smse.set('season', season);
  ThemeManager.apply(season);

  const meta = SEASON_META[season] || SEASON_META['cool-summer'];
  const theme = ThemeManager.THEMES[season] || ThemeManager.THEMES['cool-summer'];

  // Title
  document.getElementById('seasonTitle').textContent = meta.zh;
  document.getElementById('seasonSubtitle').textContent = meta.en;

  // Watermark
  const kwText = (meta.keywords[0] + '  ').repeat(30);
  document.getElementById('nameCardWatermark').textContent = kwText;

  // Avatar
  const avatarEl = document.getElementById('nameCardAvatar');
  const savedAvatar = smse.get('avatar');
  const savedSpirit = smse.get('spirit') || 'swan';
  if (savedAvatar) {
    avatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar" />`;
  } else {
    const spiritData = SPIRITS[savedSpirit] || SPIRITS.swan;
    avatarEl.innerHTML = `<span class="card-spirit-emoji">${spiritData.emoji}</span>`;
  }

  // Nickname
  document.getElementById('nameCardNickname').textContent = smse.get('nickname') || 'MYSTIC';

  // Copy
  document.getElementById('reportCopy').textContent = meta.copy;

  // Palette collage
  buildPaletteCollage('paletteCollage', theme, false);

  // Buttons
  document.getElementById('btnGoShare').onclick = () => {
    trackEvent('ShareCardGenerated');
    showPage('export');
  };
  document.getElementById('btnRestart').onclick = () => {
    smse.clear();
    PipelineClient.reset();
    ThemeManager.apply('cool-summer');
    showPage('cover', 'backward');
  };
}

function animateIn(el) {
  el.animate([
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
}

const SKELETON = '<div class="ai-skeleton"><div class="ai-skeleton-line"></div><div class="ai-skeleton-line short"></div></div>';

function renderPersonalityReport(a) {
  if (!a) return '';
  const traitsHtml = (a.coreTraits || []).map(t => `<span class="ai-badge">${t}</span>`).join('');
  const innerHtml = a.innerWorld ? `<p class="ai-report-text">${a.innerWorld}</p>` : '';
  const strengthHtml = a.strengths ? `<p class="ai-features">${a.strengths}</p>` : '';
  const dnaHtml = (a.styleDNA || []).map(d => `
    <div class="ai-advice-card">
      <span class="ai-advice-category">${d.trait}</span>
      <p class="ai-advice-content">${d.description}</p>
    </div>
  `).join('');
  return (a.personalityType ? `<div class="ai-section-title">${a.personalityType}</div>` : '')
    + (traitsHtml ? `<div class="ai-skin-tone">${traitsHtml}</div>` : '')
    + innerHtml + strengthHtml + dnaHtml;
}

function renderFaceReport(f) {
  if (!f) return '';
  const badges = [
    f.hairColor && `发色 ${f.hairColor}`,
    f.eyeColor && `瞳色 ${f.eyeColor}`,
    f.skinBaseTone && `底色 ${f.skinBaseTone}`,
    f.skinDepth && `深浅 ${f.skinDepth}`,
    f.contrastLevel && `对比 ${f.contrastLevel}`,
  ].filter(Boolean).map(t => `<span class="ai-badge">${t}</span>`).join('');
  const featuresHtml = f.facialFeatures ? `<p class="ai-features">${f.facialFeatures}</p>` : '';
  const contrastHtml = f.contrastResponse ? `<p class="ai-report-text"><strong>明度测试：</strong>${f.contrastResponse}</p>` : '';
  const tempHtml = f.temperatureResponse ? `<p class="ai-report-text"><strong>色温测试：</strong>${f.temperatureResponse}</p>` : '';
  const avoidHtml = f.avoidColors && f.avoidColors.length
    ? `<div class="ai-avoid"><span class="ai-avoid-label">LESS IDEAL:</span> ${f.avoidColors.join(' / ')}</div>` : '';
  return (badges ? `<div class="ai-skin-tone">${badges}</div>` : '')
    + featuresHtml + contrastHtml + tempHtml + avoidHtml;
}

function renderSeasonReasoning(r) {
  if (!r) return '';
  const confidenceHtml = r.confidence ? `<span class="ai-badge">置信度 ${r.confidence}</span>` : '';
  const candidateHtml = r.candidates && r.candidates.length
    ? `<p class="ai-features">候选季相：${r.candidates.join(' → ')}</p>` : '';
  const reasoningHtml = r.reasoning ? `<p class="ai-report-text">${r.reasoning}</p>` : '';
  return confidenceHtml + candidateHtml + reasoningHtml;
}

function renderStyling(s) {
  if (!s) return '';
  const summaryHtml = s.summary ? `<p class="ai-features">${s.summary}</p>` : '';
  const recsHtml = (s.recommendations || []).map(r => `
    <div class="ai-styling-card">
      <div class="ai-styling-scene">${r.scene}</div>
      <div class="ai-styling-pieces">${(r.pieces || []).join(' / ')}</div>
      <div class="ai-styling-colors">
        ${r.colorScheme ? `<span class="ai-badge">主色 ${r.colorScheme.primary}</span>
        <span class="ai-badge">辅色 ${r.colorScheme.secondary}</span>
        <span class="ai-badge">点缀 ${r.colorScheme.accent}</span>` : ''}
      </div>
      ${r.tip ? `<p class="ai-report-text">${r.tip}</p>` : ''}
      ${r.why ? `<p class="ai-features">${r.why}</p>` : ''}
    </div>
  `).join('');
  const colorGuideHtml = s.colorGuide ? `
    <div class="ai-color-guide">
      <div class="ai-color-guide-row best">${(s.colorGuide.bestColors || []).map(c => `<span class="ai-badge best">${c}</span>`).join('')}</div>
      <div class="ai-color-guide-row good">${(s.colorGuide.goodColors || []).map(c => `<span class="ai-badge">${c}</span>`).join('')}</div>
      <div class="ai-color-guide-row caution">${(s.colorGuide.cautionColors || []).map(c => `<span class="ai-badge caution">${c}</span>`).join('')}</div>
    </div>
  ` : '';
  const sigHtml = s.signatureLook ? `<p class="ai-report-text">${s.signatureLook}</p>` : '';
  return summaryHtml + recsHtml + colorGuideHtml + sigHtml;
}

function initAIReports(result) {
  if (!result) {
    result = PipelineClient.getCachedResult();
  }

  const sections = [
    { id: 'aiPersonalitySection', contentId: 'aiPersonalityContent', data: result && result.personality, render: renderPersonalityReport },
    { id: 'aiSkinSection', contentId: 'aiSkinContent', data: result && result.faceReport, render: renderFaceReport },
    { id: 'aiSeasonSection', contentId: 'aiSeasonContent', data: result && result.seasonReasoning, render: renderSeasonReasoning },
    { id: 'aiStylingSection', contentId: 'aiStylingContent', data: result && result.styling, render: renderStyling },
  ];

  sections.forEach(({ id, contentId, data, render }) => {
    const section = document.getElementById(id);
    const content = document.getElementById(contentId);
    if (!section || !content) return;

    if (data) {
      section.style.display = 'block';
      content.innerHTML = render(data);
      animateIn(section);
    } else {
      section.style.display = 'none';
    }
  });
}

function buildPaletteCollage(containerId, theme, small = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const sw = document.createElement('div');
    sw.className = small ? 'sc-swatch' : 'palette-swatch';
    sw.style.background = theme[`--palette-${i}`] || '#ccc';
    const deg = (Math.random() * 6 - 3).toFixed(1);
    sw.style.transform = `rotate(${deg}deg)`;
    el.appendChild(sw);
  }
}

/* =========================================================
   REPORT MODAL
   ========================================================= */
function openReportModal() {
  const result = PipelineClient.getResult() || PipelineClient.getCachedResult();

  const modal = document.getElementById('reportModal');
  if (!result) return;

  document.getElementById('modalPersonalityContent').innerHTML = renderPersonalityReport(result.personality);
  document.getElementById('modalSkinContent').innerHTML = renderFaceReport(result.faceReport);
  document.getElementById('modalSeasonContent').innerHTML = renderSeasonReasoning(result.seasonReasoning);
  document.getElementById('modalStylingContent').innerHTML = renderStyling(result.styling);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/* =========================================================
   PAGE 7 · SHARE EXPORT (tasks 9.1–9.6)
   ========================================================= */
function initExportPage() {
  const season = smse.get('season') || 'cool-summer';
  const meta   = SEASON_META[season];
  const theme  = ThemeManager.THEMES[season] || ThemeManager.THEMES['cool-summer'];

  // Populate share card
  document.getElementById('scWatermark').textContent = ((meta.keywords[0] + '  ').repeat(30));
  document.getElementById('scSeasonLabel').textContent = meta.en;

  const scAvatar = document.getElementById('scAvatar');
  const savedAvatar = smse.get('avatar');
  const savedSpirit = smse.get('spirit') || 'swan';
  if (savedAvatar) {
    scAvatar.innerHTML = `<img src="${savedAvatar}" crossorigin="anonymous" alt="avatar" />`;
  } else {
    const spiritData = SPIRITS[savedSpirit] || SPIRITS.swan;
    scAvatar.innerHTML = `<span class="card-spirit-emoji">${spiritData.emoji}</span>`;
  }

  document.getElementById('scNickname').textContent = smse.get('nickname') || 'MYSTIC';
  document.getElementById('scCopy').textContent = meta.copy;
  buildPaletteCollage('scPalette', theme, true);

  // Apply theme color to share card background
  document.getElementById('share-card').style.background = theme['--accent-color'];

  // Back button
  document.getElementById('btnBackToStory').onclick = () => showPage('story', 'backward');

  // View report modal
  document.getElementById('btnViewReport').onclick = openReportModal;
  document.getElementById('reportModalClose').onclick = closeReportModal;
  document.getElementById('reportBackdrop').onclick = closeReportModal;

  // 9.6 Show loading, generate image
  document.getElementById('exportLoading').style.display = 'flex';
  document.getElementById('exportButtons').style.display = 'none';

  // 9.3 Wait for fonts then capture
  document.fonts.ready.then(() => {
    setTimeout(() => generateShareImage(), 400);
  });
}

let shareImageBlob = null;
let shareImageUrl  = null;

// 9.2 Generate via html2canvas
async function generateShareImage() {
  try {
    const card = document.getElementById('share-card');
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
    });

    canvas.toBlob(blob => {
      shareImageBlob = blob;
      shareImageUrl  = URL.createObjectURL(blob);
      // Verify 3:4 ratio
      if (Math.abs(canvas.width / canvas.height - 3/4) > 0.05) {
        console.warn('Share card aspect ratio deviation:', canvas.width, 'x', canvas.height);
      }

      document.getElementById('exportLoading').style.display = 'none';
      document.getElementById('exportButtons').style.display = 'flex';

      setupExportButtons();
    }, 'image/png');

  } catch (err) {
    console.error('html2canvas error', err);
    document.getElementById('exportLoading').style.display = 'none';
    document.getElementById('exportButtons').style.display = 'flex';
    setupExportButtons();
  }
}

function setupExportButtons() {
  const nickname = smse.get('nickname') || 'season-me';
  const filename = `season-me-${nickname}.png`.replace(/\s+/g, '-').toLowerCase();

  // 9.4 Save
  document.getElementById('btnSave').onclick = () => {
    if (!shareImageUrl) return;
    trackEvent('ImageSaved');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      window.open(shareImageUrl, '_blank');
      document.getElementById('iosHint').style.display = 'block';
    } else {
      const a = document.createElement('a');
      a.href = shareImageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // 9.5 Publish
  document.getElementById('btnPublish').onclick = async () => {
    if (!shareImageBlob) {
      window.open(shareImageUrl, '_blank');
      return;
    }
    trackEvent('ImageSaved');
    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({ 'image/png': shareImageBlob });
        await navigator.clipboard.write([item]);
        showToast('图片已复制，可直接粘贴至小红书/微信');
      } else {
        window.open(shareImageUrl, '_blank');
      }
    } catch {
      window.open(shareImageUrl, '_blank');
    }
  };

  // 9.7 Go to community
  document.getElementById('btnGoCommunity').onclick = () => {
    showPage('community');
  };
}

function showToast(msg) {
  let toast = document.getElementById('smse-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'smse-toast';
    toast.style.cssText = `
      position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,0.8); color:#fff; padding:0.75rem 1.25rem;
      border-radius:8px; font-family:'Space Mono',monospace; font-size:0.65rem;
      letter-spacing:0.05em; z-index:9999; white-space:nowrap;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

/* =========================================================
   10. COMMUNITY MAP
   ========================================================= */

const SUPABASE_URL = 'https://ufwogjbbhkhnxqtdbplj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd29namJiaGtobnhxdGRicGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjcxMzEsImV4cCI6MjA5MTMwMzEzMX0.bc1dEzRlROKsmwdDEFXIandH9Ybm5EN0J44txlFR0Wo';

let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  if (typeof supabase === 'undefined' || !supabase.createClient) return null;
  _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _sb;
}

function getSessionId() {
  let id = smse.get('sessionId');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() :
      'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
    smse.set('sessionId', id);
  }
  return id;
}

let communityMap = null;
let communityMarkers = null;
let communityPosts = [];
let userLocation = null;
let currentSheetPost = null;

function initCommunityPage() {
  const sb = getSupabase();
  if (!sb) {
    showToast('Community is not available yet');
    return;
  }

  // Initialize map
  if (!communityMap) {
    communityMap = L.map('communityMap', {
      center: [30, 110],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(communityMap);

    communityMarkers = L.layerGroup().addTo(communityMap);
    L.control.zoom({ position: 'bottomleft' }).addTo(communityMap);
  }

  // Fix map rendering after page becomes visible
  setTimeout(() => communityMap.invalidateSize(), 150);

  // Back button
  document.getElementById('btnCommunityBack').onclick = () => {
    closeCommunitySheet();
    showPage('cover', 'backward');
  };

  // FAB -> open post creation modal
  document.getElementById('btnCommunityPost').onclick = () => openPostModal();

  // Close modal
  document.getElementById('btnPostModalClose').onclick = () => closePostModal();

  // Detect location button
  document.getElementById('btnDetectLocation').onclick = detectLocation;

  // Submit post
  document.getElementById('btnSubmitPost').onclick = submitPost;

  // Close sheet on map click
  communityMap.on('click', () => closeCommunitySheet());

  // Load posts from Supabase
  loadCommunityPosts();

  // Try to get user location
  if (!userLocation) detectLocation();
}

async function loadCommunityPosts() {
  const sb = getSupabase();
  if (!sb) return;

  const { data, error } = await sb
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Failed to load community posts:', error);
    return;
  }

  communityPosts = data || [];
  document.getElementById('communityPostCount').textContent = communityPosts.length + ' posts';
  renderMapMarkers();
}

function renderMapMarkers() {
  if (!communityMarkers) return;
  communityMarkers.clearLayers();

  communityPosts.forEach(post => {
    const fallbackHtml = getSpiritEmojiHtml(post.spirit);
    const icon = L.divIcon({
      className: 'community-marker-wrapper',
      html: '<div class="community-marker"><img src="' + post.card_image_url + '" alt="' + escapeAttr(post.nickname) + '" onerror="this.parentElement.innerHTML=\'' + fallbackHtml.replace(/'/g, "\\'") + '\'" /></div>',
      iconSize: [44, 58],
      iconAnchor: [22, 29],
    });

    const marker = L.marker([post.latitude, post.longitude], { icon })
      .addTo(communityMarkers);

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      openCommunitySheet(post);
    });
  });
}

function getSpiritEmojiHtml(spiritId) {
  const s = SPIRITS[spiritId];
  if (s) return '<span style="font-size:1.5rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%">' + s.emoji + '</span>';
  return '<span style="font-size:1rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#999">?</span>';
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openCommunitySheet(post) {
  currentSheetPost = post.id;
  const sheet = document.getElementById('communitySheet');
  const content = document.getElementById('communitySheetContent');

  const liked = isPostLikedByUser(post.id);
  const disliked = isPostDislikedByUser(post.id);
  const spiritEmoji = getSpiritEmojiHtml(post.spirit);
  const seasonLabel = SEASON_META[post.season] ? SEASON_META[post.season].en : post.season;

  content.innerHTML =
    '<div style="display:flex;gap:1rem;align-items:flex-start">' +
      '<img src="' + post.card_image_url + '" alt="card" ' +
        'style="width:110px;height:147px;object-fit:cover;border-radius:10px;border:1px solid rgba(0,0,0,0.1);flex-shrink:0" ' +
        'onerror="this.style.display=\'none\'" />' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-family:Space Mono,monospace;font-size:0.5rem;letter-spacing:0.15em;color:var(--text-secondary)">' + escapeHtml(seasonLabel) + '</div>' +
        '<div style="font-family:Playfair Display,serif;font-size:1.05rem;font-weight:700;color:var(--text-main);margin-top:0.15rem">' + escapeHtml(post.nickname) + '</div>' +
        '<div style="font-size:0.85rem;margin-top:0.15rem">' + spiritEmoji + ' ' + escapeHtml(SPIRITS[post.spirit] ? SPIRITS[post.spirit].label : post.spirit) + '</div>' +
        (post.quote_text ? '<p style="font-family:Playfair Display,serif;font-style:italic;font-size:0.8rem;color:var(--text-main);margin-top:0.5rem;line-height:1.5">\u201C' + escapeHtml(post.quote_text) + '\u201D</p>' : '') +
        (post.location_label ? '<div style="font-family:Space Mono,monospace;font-size:0.5rem;color:var(--text-secondary);margin-top:0.4rem">\uD83D\uDCCD ' + escapeHtml(post.location_label) + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.85rem;padding-top:0.65rem;border-top:1px solid rgba(0,0,0,0.08)">' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button class="community-like-btn ' + (liked ? 'liked' : '') + '" onclick="toggleLike(\'' + post.id + '\')">' +
          (liked ? '\u2665' : '\u2661') + ' ' + post.likes_count +
        '</button>' +
        '<button class="community-dislike-btn ' + (disliked ? 'disliked' : '') + '" onclick="toggleDislike(\'' + post.id + '\')">' +
          (disliked ? '\uD83E\uDD12' : '\uD83D\uDC4E') + ' ' + (post.dislikes_count || 0) +
        '</button>' +
      '</div>' +
      '<span style="font-family:Space Mono,monospace;font-size:0.5rem;color:var(--text-secondary)">' + formatTimeAgo(post.created_at) + '</span>' +
    '</div>';

  sheet.classList.add('open');
}

function closeCommunitySheet() {
  currentSheetPost = null;
  document.getElementById('communitySheet').classList.remove('open');
}

function isPostLikedByUser(postId) {
  const liked = smse.getJSON('communityLikes') || [];
  return liked.includes(postId);
}

function isPostDislikedByUser(postId) {
  const disliked = smse.getJSON('communityDislikes') || [];
  return disliked.includes(postId);
}

async function toggleLike(postId) {
  const sb = getSupabase();
  if (!sb) return;

  const sessionId = getSessionId();
  const alreadyLiked = isPostLikedByUser(postId);
  const alreadyDisliked = isPostDislikedByUser(postId);

  try {
    if (alreadyLiked) {
      await sb.from('community_likes').delete().match({ post_id: postId, session_id: sessionId });
      await sb.rpc('decrement_likes', { post_id_input: postId });
      smse.setJSON('communityLikes', (smse.getJSON('communityLikes') || []).filter(id => id !== postId));
    } else {
      if (alreadyDisliked) {
        await sb.from('community_dislikes').delete().match({ post_id: postId, session_id: sessionId });
        await sb.rpc('decrement_dislikes', { post_id_input: postId });
        smse.setJSON('communityDislikes', (smse.getJSON('communityDislikes') || []).filter(id => id !== postId));
      }
      await sb.from('community_likes').insert({ post_id: postId, session_id: sessionId });
      await sb.rpc('increment_likes', { post_id_input: postId });
      const liked = smse.getJSON('communityLikes') || [];
      liked.push(postId);
      smse.setJSON('communityLikes', liked);
    }

    await refreshSheetAndMarkers(postId);
  } catch (err) {
    console.error('Toggle like failed:', err);
  }
}

async function toggleDislike(postId) {
  const sb = getSupabase();
  if (!sb) return;

  const sessionId = getSessionId();
  const alreadyDisliked = isPostDislikedByUser(postId);
  const alreadyLiked = isPostLikedByUser(postId);

  try {
    if (alreadyDisliked) {
      await sb.from('community_dislikes').delete().match({ post_id: postId, session_id: sessionId });
      await sb.rpc('decrement_dislikes', { post_id_input: postId });
      smse.setJSON('communityDislikes', (smse.getJSON('communityDislikes') || []).filter(id => id !== postId));
    } else {
      if (alreadyLiked) {
        await sb.from('community_likes').delete().match({ post_id: postId, session_id: sessionId });
        await sb.rpc('decrement_likes', { post_id_input: postId });
        smse.setJSON('communityLikes', (smse.getJSON('communityLikes') || []).filter(id => id !== postId));
      }
      await sb.from('community_dislikes').insert({ post_id: postId, session_id: sessionId });
      await sb.rpc('increment_dislikes', { post_id_input: postId });
      const disliked = smse.getJSON('communityDislikes') || [];
      disliked.push(postId);
      smse.setJSON('communityDislikes', disliked);
    }

    await refreshSheetAndMarkers(postId);
  } catch (err) {
    console.error('Toggle dislike failed:', err);
  }
}

async function refreshSheetAndMarkers(postId) {
  await loadCommunityPosts();
  if (currentSheetPost === postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (post) openCommunitySheet(post);
  }
}

window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;

function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

/* Post creation flow */
async function openPostModal() {
  const season = smse.get('season');
  if (!season) {
    showToast('Complete the quiz first to share your card');
    return;
  }

  // Re-generate share card blob if not available
  if (!shareImageBlob) {
    await ensureShareCardPopulated();
    await generateShareImageForCommunity();
  }

  if (!shareImageBlob) {
    showToast('Failed to generate share card');
    return;
  }

  const modal = document.getElementById('communityPostModal');
  const preview = document.getElementById('communityCardPreview');

  if (shareImageUrl) {
    preview.innerHTML = '<img src="' + shareImageUrl + '" />';
  }

  modal.classList.add('active');

  if (!userLocation) detectLocation();
}

function ensureShareCardPopulated() {
  const season = smse.get('season') || 'cool-summer';
  const meta = SEASON_META[season];
  const theme = ThemeManager.THEMES[season] || ThemeManager.THEMES['cool-summer'];

  document.getElementById('scWatermark').textContent = ((meta.keywords[0] + '  ').repeat(30));
  document.getElementById('scSeasonLabel').textContent = meta.en;

  const scAvatar = document.getElementById('scAvatar');
  const savedAvatar = smse.get('avatar');
  const savedSpirit = smse.get('spirit') || 'swan';
  if (savedAvatar) {
    scAvatar.innerHTML = '<img src="' + savedAvatar + '" crossorigin="anonymous" alt="avatar" />';
  } else {
    const spiritData = SPIRITS[savedSpirit] || SPIRITS.swan;
    scAvatar.innerHTML = '<span class="card-spirit-emoji">' + spiritData.emoji + '</span>';
  }

  document.getElementById('scNickname').textContent = smse.get('nickname') || 'MYSTIC';
  document.getElementById('scCopy').textContent = meta.copy;
  buildPaletteCollage('scPalette', theme, true);
  document.getElementById('share-card').style.background = theme['--accent-color'];

  // Make the share-card visible temporarily for html2canvas
  const container = document.getElementById('share-card').parentElement;
  container.style.visibility = 'visible';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
}

function restoreShareCardContainer() {
  const container = document.getElementById('share-card').parentElement;
  container.style.visibility = '';
  container.style.position = '';
  container.style.left = '';
  container.style.top = '';
}

async function generateShareImageForCommunity() {
  try {
    await document.fonts.ready;
    const card = document.getElementById('share-card');
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
        shareImageBlob = blob;
        shareImageUrl = URL.createObjectURL(blob);
        restoreShareCardContainer();
        resolve(blob);
      }, 'image/png');
    });
  } catch (err) {
    console.error('html2canvas community error', err);
    restoreShareCardContainer();
    return null;
  }
}

function closePostModal() {
  document.getElementById('communityPostModal').classList.remove('active');
}

function detectLocation() {
  const label = document.getElementById('communityLocationLabel');
  if (!label) return;
  label.textContent = 'Detecting location...';

  if (!navigator.geolocation) {
    label.textContent = 'Location unavailable';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      reverseGeocode(userLocation.lat, userLocation.lng);
    },
    (err) => {
      console.warn('Geolocation error:', err);
      label.textContent = 'Location unavailable';
      userLocation = { lat: 0, lng: 0 };
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

async function reverseGeocode(lat, lng) {
  const label = document.getElementById('communityLocationLabel');
  try {
    const resp = await fetch(
      'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=zh',
      { headers: { 'User-Agent': 'SeasonMe/1.0' } }
    );
    const data = await resp.json();
    const city = data.address?.city || data.address?.town || data.address?.state || '';
    const country = data.address?.country || '';
    label.textContent = city ? (city + ', ' + country) : (country || (lat.toFixed(2) + ', ' + lng.toFixed(2)));
  } catch {
    label.textContent = lat.toFixed(2) + ', ' + lng.toFixed(2);
  }
}

async function submitPost() {
  const quoteInput = document.getElementById('communityQuoteInput');
  const submitBtn = document.getElementById('btnSubmitPost');

  if (!userLocation) {
    showToast('Please wait for location detection');
    return;
  }
  if (!shareImageBlob) {
    showToast('No share card available');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'PUBLISHING...';

  try {
    // Step 1: Upload image via API (base64)
    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(shareImageBlob);
    });
    const base64Data = await base64Promise;

    const uploadResp = await fetch('/api/upload-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: base64Data,
        mimeType: 'image/png',
        fileName: getSessionId() + '_' + Date.now() + '.png',
      }),
    });
    if (!uploadResp.ok) throw new Error('Image upload failed');
    const { url: cardImageUrl } = await uploadResp.json();

    // Step 2: Create post in Supabase
    const sb = getSupabase();
    const locationLabel = document.getElementById('communityLocationLabel').textContent;

    const { data, error } = await sb
      .from('community_posts')
      .insert({
        session_id: getSessionId(),
        nickname: smse.get('nickname') || 'ANONYMOUS',
        spirit: smse.get('spirit') || 'swan',
        season: smse.get('season') || 'cool-summer',
        card_image_url: cardImageUrl,
        quote_text: quoteInput.value.trim().slice(0, 100),
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        location_label: locationLabel,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    showToast('Shared to community!');
    closePostModal();
    quoteInput.value = '';

    await loadCommunityPosts();
    if (communityMap && data) {
      communityMap.flyTo([data.latitude, data.longitude], 10, { duration: 1.5 });
    }
  } catch (err) {
    console.error('Post submission failed:', err);
    showToast('Failed to share \u2014 please try again');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'PUBLISH TO MAP';
  }
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Dark mode init first (sets data-theme attribute)
  initDarkMode();

  // Apply season theme (respects dark mode)
  const savedSeason = smse.get('season');
  if (savedSeason) ThemeManager.apply(savedSeason);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Show cover page
  document.getElementById('page-cover').setAttribute('data-active', 'true');
  document.getElementById('page-cover').style.display = 'block';

  initCoverPage();
  initColourGuide();
});

/* =========================================================
   DARK MODE
   ========================================================= */
function initDarkMode() {
  const saved = smse.get('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeToggle('dark');
  } else if (saved === 'light') {
    document.documentElement.removeAttribute('data-theme');
    updateThemeToggle('light');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeToggle('dark');
  }

  const btn = document.getElementById('btnThemeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        smse.set('theme', 'light');
        updateThemeToggle('light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        smse.set('theme', 'dark');
        updateThemeToggle('dark');
      }
      // Re-apply season theme to update CSS vars for new mode
      const savedSeason = smse.get('season');
      if (savedSeason) ThemeManager.apply(savedSeason);
    });
  }
}

function updateThemeToggle(mode) {
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.textContent = mode === 'dark' ? '☾' : '☀';
}

/* =========================================================
   COLOUR GUIDE MODAL
   ========================================================= */
const COLOUR_GUIDE_SEASONS = [
  {
    id: 'light-spring',
    nameEn: 'Light Spring',
    nameZh: '明亮春季',
    palette: ['#F9E4B7', '#F5C6A0', '#F0A88A', '#E88A72', '#D4C5A9'],
    accentColor: '#F0A88A',
    figures: ['奥黛丽·赫本', '泰勒·斯威夫特', '布兰妮·斯皮尔斯'],
    traits: ['明朗', '活泼', '清新', '亲切', '阳光'],
    style: '浅暖色系最显气色，米白、桃粉、嫩黄是主力色。避免过深或过冷的色调。推荐轻盈面料如雪纺、棉麻，款式简洁不繁复。金色饰品提亮整体，印花选细碎花卉或几何小图案。'
  },
  {
    id: 'warm-spring',
    nameEn: 'Warm Spring',
    nameZh: '温暖春季',
    palette: ['#F7C59F', '#F4A261', '#E76F51', '#C44536', '#8B3A3A'],
    accentColor: '#F4A261',
    figures: ['贾斯汀·比伯', '艾玛·斯通', '林赛·罗韩'],
    traits: ['热情', '温暖', '直接', '有活力', '感染力强'],
    style: '暖橙、珊瑚、番茄红是天生好色。大地色系穿搭最具整体感，搭配棕色皮革配件。避免冷灰和冰蓝。推荐有质感的棉质或轻磅针织，金属感首饰偏暖金色调。'
  },
  {
    id: 'clear-spring',
    nameEn: 'Clear Spring',
    nameZh: '清澈春季',
    palette: ['#FFE8D6', '#FFB347', '#FF6B6B', '#C23B22', '#1B998B'],
    accentColor: '#FF6B6B',
    figures: ['斯嘉丽·约翰逊', '安吉丽娜·朱莉', '张曼玉'],
    traits: ['鲜明', '对比强', '个性突出', '有张力', '记忆点强'],
    style: '高饱和对比色是最佳武器，宝蓝配正红、翠绿配珊瑚都能驾驭。避免粉雾色和灰调。款式可以大胆，结构感强的剪裁反而衬托气场。配件选饱和色或金属感十足的款式。'
  },
  {
    id: 'light-summer',
    nameEn: 'Light Summer',
    nameZh: '明亮夏季',
    palette: ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#B0BEC5'],
    accentColor: '#9FA8DA',
    figures: ['格蕾丝·凯利', '妮可·基德曼', '凯特·布兰切特'],
    traits: ['优雅', '柔和', '知性', '低调', '精致'],
    style: '粉紫、薰衣草、冰蓝和浅灰蓝是专属配色。整体建议选低饱和度的冷柔色，避免暖黄和大地色。面料偏向丝质、薄款针织。银色或玫瑰金首饰比黄金更出彩。'
  },
  {
    id: 'cool-summer',
    nameEn: 'Cool Summer',
    nameZh: '清冷夏季',
    palette: ['#CFE2FF', '#9EC5FE', '#6EA8FE', '#3D8BCD', '#084298'],
    accentColor: '#6EA8FE',
    figures: ['凯特·王妃', '娜塔莉·波特曼', '范冰冰'],
    traits: ['冷静', '理性', '高冷', '有距离感', '气场稳'],
    style: '玫瑰灰、灰紫、冰粉和烟蓝最为和谐。整体穿搭注重协调性，适合单色调叠穿。避免橙色系和暖棕。剪裁偏向简洁利落，银色配件提升整体精致感。'
  },
  {
    id: 'soft-summer',
    nameEn: 'Soft Summer',
    nameZh: '柔和夏季',
    palette: ['#D4C5C7', '#C2A8A8', '#A67C7C', '#8B5A5A', '#6B3F3F'],
    accentColor: '#C2A8A8',
    figures: ['莫妮卡·贝鲁奇', '艾拉·菲茨杰拉德', '苏菲·玛索'],
    traits: ['温柔', '内敛', '细腻', '感性', '亲和'],
    style: '雾玫瑰、灰粉、蓝灰、浅茶色构成最佳衣橱。饱和度要低，冷暖色均可但要偏灰调。避免纯黑和高亮荧光色。面料选有垂感的柔软材质，整体给人温柔不失品味的感觉。'
  },
  {
    id: 'soft-autumn',
    nameEn: 'Soft Autumn',
    nameZh: '柔和秋季',
    palette: ['#E8D5B7', '#D4A96A', '#B5835A', '#8B6343', '#5C3D2E'],
    accentColor: '#D4A96A',
    figures: ['布莱克·莱弗利', '杰西卡·阿尔芭', '费利西蒂·琼斯'],
    traits: ['温暖', '成熟', '自然', '包容', '大气'],
    style: '驼色、摩卡、橄榄绿、砖红是天然基础色，搭配磨砂皮革配件最协调。避免冷灰和冰蓝。面料选有质感的羊毛、棉麻，款式不宜太紧身，宽松有型更舒适大方。'
  },
  {
    id: 'warm-autumn',
    nameEn: 'Warm Autumn',
    nameZh: '温暖秋季',
    palette: ['#F4A261', '#E76F51', '#C44536', '#8B3A3A', '#5C2E2E'],
    accentColor: '#E76F51',
    figures: ['朱利亚·罗伯茨', '梅根·福克斯', '莱昂纳多·迪卡普里奥'],
    traits: ['自信', '大气', '热烈', '有存在感', '成熟魅力'],
    style: '深番茄红、咖棕、暖橄榄、橙棕是最强底色，穿搭时整体保持暖色调统一感。避免冷色系和荧光色。皮革、粗纺羊毛等厚重材质质感出众，金色和铜色是最佳配件选择。'
  },
  {
    id: 'deep-autumn',
    nameEn: 'Deep Autumn',
    nameZh: '深邃秋季',
    palette: ['#8B4513', '#6B3A2A', '#4A2518', '#2D1B0E', '#1A1008'],
    accentColor: '#8B4513',
    figures: ['裴斗娜', '宝拉·阿巴杜尔', '詹妮弗·洛佩兹'],
    traits: ['神秘', '深邃', '强势', '独特', '有故事感'],
    style: '深栗、酒红、暗绿、深棕是专属色系，整体着装偏向深色调，单色搭配更显气场。避免浅粉和粉蜡笔色。推荐厚重面料和立体剪裁，金色或深铜色饰品强化整体高级感。'
  },
  {
    id: 'clear-winter',
    nameEn: 'Clear Winter',
    nameZh: '清澈冬季',
    palette: ['#FFFFFF', '#1A1A2E', '#16213E', '#0F3460', '#E94560'],
    accentColor: '#E94560',
    figures: ['奥黛丽·塔图', '宋慧乔', '章子怡'],
    traits: ['鲜明', '干净', '对比强', '有冲击力', '印象深刻'],
    style: '纯白与纯黑的高对比搭配是天生优势，宝蓝、正红、翠绿都能轻松驾驭。避免混浊和灰调色。剪裁要干净利落，避免堆叠繁复。银色和黑色配件最能凸显冬季清澈感。'
  },
  {
    id: 'cool-winter',
    nameEn: 'Cool Winter',
    nameZh: '清冷冬季',
    palette: ['#E8E8F0', '#B0B0C8', '#7878A0', '#404068', '#181830'],
    accentColor: '#7878A0',
    figures: ['凯特·温斯莱特', '裘德·洛', '周迅'],
    traits: ['冷静', '疏离', '理性', '高级感强', '有城市感'],
    style: '冰灰、钢蓝、烟紫、纯白是最佳选择，整体偏冷色调最显气质。避免暖黄和大地色。极简主义穿搭最出彩，单色系叠穿、银色配件是标配，面料选有光泽感的材质。'
  },
  {
    id: 'deep-winter',
    nameEn: 'Deep Winter',
    nameZh: '深邃冬季',
    palette: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560'],
    accentColor: '#533483',
    figures: ['莫妮卡·贝鲁奇', '碧昂丝', '赵雷'],
    traits: ['深邃', '磁场强大', '有压迫感', '神秘', '成熟'],
    style: '深酒红、墨绿、深紫、深蓝和纯黑打造强势衣橱。避免浅色和低饱和度色调，深色调才能衬托出深冬季的气场。推荐挺括面料和结构感强的款式，金属配件选黑色或深银色。'
  }
];

let cgCurrentIndex = 0;

function initColourGuide() {
  const modal  = document.getElementById('colourGuideModal');
  const tabsEl = document.getElementById('cgTabs');
  const cardsEl = document.getElementById('cgCards');

  // Build tabs
  COLOUR_GUIDE_SEASONS.forEach((s, i) => {
    const tab = document.createElement('button');
    tab.className = 'cg-tab' + (i === 0 ? ' active' : '');
    tab.textContent = s.nameEn.toUpperCase();
    tab.dataset.index = i;
    tab.onclick = () => showCgCard(i);
    tabsEl.appendChild(tab);
  });

  // Build cards
  COLOUR_GUIDE_SEASONS.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'cg-card' + (i === 0 ? ' visible' : '');
    card.dataset.index = i;

    // Palette strip
    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'cg-palette';
    s.palette.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'cg-palette-swatch';
      sw.style.background = c;
      paletteDiv.appendChild(sw);
    });

    // Season title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'cg-season-title';
    titleDiv.innerHTML = '<div class="cg-season-name-en">' + s.nameEn + '</div>' +
      '<div class="cg-season-name-zh">' + s.nameZh + '</div>';

    // Typical figures
    const figDiv = document.createElement('div');
    figDiv.className = 'cg-figures';
    figDiv.innerHTML = '<span class="cg-section-label">Typical Figures</span>';
    const chips = document.createElement('div');
    chips.className = 'cg-figure-chips';
    s.figures.forEach(name => {
      const chip = document.createElement('div');
      chip.className = 'cg-figure-chip';
      chip.innerHTML = '<span class="cg-figure-dot" style="background:' + s.accentColor + '"></span>' + name;
      chips.appendChild(chip);
    });
    figDiv.appendChild(chips);

    // Traits
    const traitsDiv = document.createElement('div');
    traitsDiv.className = 'cg-traits';
    traitsDiv.innerHTML = '<span class="cg-section-label">Personality</span>';
    const tagList = document.createElement('div');
    tagList.className = 'cg-trait-list';
    s.traits.forEach(t => {
      const tag = document.createElement('span');
      tag.className = 'cg-trait-tag';
      tag.style.background = s.accentColor;
      tag.textContent = t;
      tagList.appendChild(tag);
    });
    traitsDiv.appendChild(tagList);

    // Divider
    const div1 = document.createElement('div');
    div1.className = 'cg-divider';

    // Style
    const styleDiv = document.createElement('div');
    styleDiv.className = 'cg-style';
    styleDiv.innerHTML = '<span class="cg-section-label">Style Guide</span>' +
      '<p class="cg-style-text">' + s.style + '</p>';

    // Nav
    const navDiv = document.createElement('div');
    navDiv.className = 'cg-nav';
    const btnPrev = document.createElement('button');
    btnPrev.className = 'cg-nav-btn';
    btnPrev.textContent = '← PREV';
    btnPrev.disabled = i === 0;
    btnPrev.onclick = () => showCgCard(cgCurrentIndex - 1);

    const counter = document.createElement('span');
    counter.className = 'cg-nav-counter';
    counter.textContent = (i + 1) + ' / ' + COLOUR_GUIDE_SEASONS.length;

    const btnNext = document.createElement('button');
    btnNext.className = 'cg-nav-btn';
    btnNext.textContent = 'NEXT →';
    btnNext.disabled = i === COLOUR_GUIDE_SEASONS.length - 1;
    btnNext.onclick = () => showCgCard(cgCurrentIndex + 1);

    navDiv.appendChild(btnPrev);
    navDiv.appendChild(counter);
    navDiv.appendChild(btnNext);

    card.appendChild(paletteDiv);
    card.appendChild(titleDiv);
    card.appendChild(figDiv);
    card.appendChild(traitsDiv);
    card.appendChild(div1);
    card.appendChild(styleDiv);
    card.appendChild(navDiv);
    cardsEl.appendChild(card);
  });

  // Open button
  document.getElementById('btnColourGuide').onclick = () => {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    trackEvent('colour_guide_open');
  };

  // Close button
  document.getElementById('btnColourGuideClose').onclick = () => closeCgModal();

  // Tap backdrop to close
  modal.addEventListener('click', e => {
    if (e.target === modal) closeCgModal();
  });
}

function closeCgModal() {
  const modal = document.getElementById('colourGuideModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function showCgCard(index) {
  if (index < 0 || index >= COLOUR_GUIDE_SEASONS.length) return;
  cgCurrentIndex = index;

  // Update tabs
  document.querySelectorAll('.cg-tab').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });

  // Scroll active tab into view
  const activeTab = document.querySelector('.cg-tab.active');
  if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

  // Show card
  document.querySelectorAll('.cg-card').forEach((c, i) => {
    c.classList.toggle('visible', i === index);
  });

  // Scroll cards back to top
  document.getElementById('cgCards').scrollTop = 0;
}

// initColourGuide is called from the main DOMContentLoaded handler above
