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
  getUsage() {
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith('smse_'))
        .reduce((sum, k) => sum + (localStorage.getItem(k) || '').length * 2, 0);
    } catch { return 0; }
  }
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
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  static getPreviewGlow(spiritId) {
    return ThemeManager.SPIRIT_GLOWS[spiritId] || 'rgba(150,150,150,0.35)';
  }
}

/* =========================================================
   1.6 Page router
   ========================================================= */
const PAGES = ['cover', 'identity', 'quiz', 'sampling', 'darkroom', 'story', 'export'];
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

  // Reset UI
  video.style.display = 'block';
  preview.style.display = 'none';
  btnShutter.style.display = '';
  btnRetake.style.display = 'none';
  btnConfirm.style.display = 'none';

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
    btnShutter.style.display = '';
    btnRetake.style.display = 'none';
    btnConfirm.style.display = 'none';
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
    // 5.4 Degrade gracefully
    video.style.display = 'none';
    document.getElementById('btnShutter').style.display = 'none';
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
  const btnShutter= document.getElementById('btnShutter');
  const btnRetake = document.getElementById('btnRetake');
  const btnConfirm= document.getElementById('btnConfirm');

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

  btnShutter.style.display = 'none';
  btnRetake.style.display = '';
  btnConfirm.style.display = '';
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

  const messages = [
    'DEVELOPING YOUR DNA...',
    'READING COLOUR SPECTRUM...',
    'MAPPING YOUR SEASON...'
  ];

  // 6.5 Start calculation immediately in background
  const calcPromise = SeasonEngine.calculate();
  const minWait = new Promise(r => setTimeout(r, 3000));

  // 6.2–6.3 Typewriter sequence
  async function typeSequence() {
    for (const msg of messages) {
      await typewriter(msg, output, 55);
      await delay(500);
      output.textContent += '\n';
    }
    // 6.4 Fade in ANALYSIS COMPLETE
    await Promise.all([calcPromise, minWait]);
    complete.classList.add('visible');
    await delay(900);
    trackEvent('QuizCompleted');
    showPage('story');
  }

  typeSequence();
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
   7. SEASON ENGINE (tasks 7.1–7.6)
   ========================================================= */
const SeasonEngine = {
  // 7.1 sRGB → Linear → XYZ → Lab
  srgbToLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  },
  linearToXyz(r, g, b) {
    // D65 matrix
    return {
      x: r*0.4124564 + g*0.3575761 + b*0.1804375,
      y: r*0.2126729 + g*0.7151522 + b*0.0721750,
      z: r*0.0193339 + g*0.1191920 + b*0.9503041
    };
  },
  xyzToLab(x, y, z) {
    const Xn=0.95047, Yn=1.00000, Zn=1.08883;
    const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787*t + 16/116;
    const fx=f(x/Xn), fy=f(y/Yn), fz=f(z/Zn);
    return { L: 116*fy-16, a: 500*(fx-fy), b: 200*(fy-fz) };
  },
  rgbToLab(r, g, b) {
    const lr = this.srgbToLinear(r);
    const lg = this.srgbToLinear(g);
    const lb = this.srgbToLinear(b);
    const xyz = this.linearToXyz(lr, lg, lb);
    return this.xyzToLab(xyz.x, xyz.y, xyz.z);
  },

  // 7.2 Sample Lab from photo base64
  sampleLabFromPhoto(base64) {
    return new Promise(resolve => {
      if (!base64) { resolve(null); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const cx = Math.floor(img.width / 2);
        const cy = Math.floor(img.height / 2);
        const sampleSize = 60;
        const sx = Math.max(0, cx - sampleSize / 2);
        const sy = Math.max(0, cy - sampleSize / 2);
        const data = ctx.getImageData(sx, sy, sampleSize, sampleSize).data;
        let sumR=0, sumG=0, sumB=0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          sumR += data[i]; sumG += data[i+1]; sumB += data[i+2];
        }
        resolve(this.rgbToLab(sumR/pixels, sumG/pixels, sumB/pixels));
      };
      img.onerror = () => resolve(null);
      img.src = base64;
    });
  },

  // 7.3 Dimension scoring
  calcDimensions(answers) {
    const dims = { E: 0, O: 0, T: 0, X: 0 };
    const counts = { E: 0, O: 0, T: 0, X: 0 };
    answers.forEach((ans, qi) => {
      const d = QUIZ_DATA[qi].dims[ans];
      Object.entries(d).forEach(([k, v]) => {
        dims[k] = (dims[k] || 0) + v;
        counts[k] = (counts[k] || 0) + 1;
      });
    });
    // Normalize to 0–1
    const result = {};
    ['E','O','T','X'].forEach(k => {
      const raw = counts[k] > 0 ? dims[k] / counts[k] : 0;
      result[k] = (raw + 1) / 2; // map -1..1 → 0..1
    });
    return result;
  },

  // 7.4 Map to season
  mapToSeason(lab, dims) {
    // Lab guidance: warm=a>5+b>10, cool=a<0
    // bright=L>65, deep=L<50
    const warm = lab ? (lab.a > 4 || lab.b > 8) : dims.T > 0.55;
    const cool = lab ? (lab.a < 0 && lab.b < 5) : dims.T < 0.45;
    const bright = lab ? lab.L > 65 : dims.E > 0.6;
    const deep   = lab ? lab.L < 50 : dims.E < 0.35;

    const highE = dims.E > 0.6;
    const highT = dims.T > 0.55;

    if (warm && bright && highE)  return 'bright-spring';
    if (warm && bright)           return 'warm-spring';
    if (!deep && !bright && !warm && !cool) return 'light-spring';

    if (cool && bright)           return 'light-summer';
    if (cool && !deep)            return 'cool-summer';
    if (!warm && !bright && !deep)return 'soft-summer';

    if (warm && deep && highE)    return 'deep-autumn';
    if (warm && deep)             return 'warm-autumn';
    if (warm && !bright)          return 'soft-autumn';

    if (cool && deep && highE)    return 'bright-winter';
    if (cool && deep)             return 'cool-winter';
    return 'deep-winter';
  },

  // 7.5 Main calculate
  async calculate() {
    const photo = smse.get('photo');
    const answers = smse.getJSON('quiz') || [];
    const dims = this.calcDimensions(answers);

    let season;
    if (photo) {
      const lab = await this.sampleLabFromPhoto(photo);
      // Weight 0.4 Lab + 0.6 dims — apply by biasing thresholds
      season = this.mapToSeason(lab, dims);
    } else {
      season = this.mapToSeason(null, dims);
    }

    smse.set('season', season);
    ThemeManager.apply(season);
    return season;
  }
};

/* 7.6 Season metadata */
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
   PAGE 6 · FEATURE STORY (tasks 8.1–8.7)
   ========================================================= */
function initStoryPage() {
  const season = smse.get('season') || 'cool-summer';
  ThemeManager.apply(season);

  const meta = SEASON_META[season] || SEASON_META['cool-summer'];
  const theme = ThemeManager.THEMES[season] || ThemeManager.THEMES['cool-summer'];

  // 8.2 Title
  document.getElementById('seasonTitle').textContent = meta.zh;
  document.getElementById('seasonSubtitle').textContent = meta.en;

  // 8.4 Watermark
  const kwText = (meta.keywords[0] + '  ').repeat(30);
  document.getElementById('nameCardWatermark').textContent = kwText;

  // 8.3 Avatar
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

  // 8.5 Copy
  document.getElementById('reportCopy').textContent = meta.copy;

  // 8.6 Palette collage
  buildPaletteCollage('paletteCollage', theme, false);

  // 8.7 Buttons
  document.getElementById('btnGoShare').onclick = () => {
    trackEvent('ShareCardGenerated');
    showPage('export');
  };
  document.getElementById('btnRestart').onclick = () => {
    smse.clear();
    ThemeManager.apply('cool-summer');
    showPage('cover', 'backward');
  };
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
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Apply default / saved theme
  const savedSeason = smse.get('season');
  if (savedSeason) ThemeManager.apply(savedSeason);

  // Dark mode init
  initDarkMode();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Show cover page
  document.getElementById('page-cover').setAttribute('data-active', 'true');
  document.getElementById('page-cover').style.display = 'block';

  initCoverPage();
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
    });
  }
}

function updateThemeToggle(mode) {
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.textContent = mode === 'dark' ? '☾' : '☀';
}
