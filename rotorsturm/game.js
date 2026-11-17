/* Rotorsturm – ein eigener senkrecht scrollender Hubschrauber-Shooter.
 * Alles (Sprites, Gelände, Schrift, Musik) wird hier per Code erzeugt. */
'use strict';

// ---------------------------------------------------------------- Bildschirm
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const W = 240;
let H = 400, SCALE = 1;
function resize() {
  const vw = innerWidth, vh = innerHeight;
  H = Math.round(Math.min(560, Math.max(340, W * vh / vw)));
  cv.width = W; cv.height = H;
  SCALE = Math.min(vw / W, vh / H);
  cv.style.width = Math.floor(W * SCALE) + 'px';
  cv.style.height = Math.floor(H * SCALE) + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------- Zufall
let seed = 1;
function rnd() {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (a, b) => a + rnd() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- Pixel-Sprites
function sprite(rows, pal) {
  const h = rows.length, w = rows[0].length, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = rows[j][i];
    if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); }
  }
  return c;
}
function flashOf(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  return c;
}
const PAL = {
  k: '#141414', r: '#d8402b', R: '#8f2216', w: '#f1f1ea', g: '#7fd8ff', G: '#2a7fb0', y: '#ffd23f', s: '#8a919b', S: '#5b616a',
  o: '#6b7a34', O: '#424d1e', t: '#2c2c26', d: '#9aa45a', b: '#3b5d7d', B: '#22394f', n: '#c9c2b0', m: '#7d7466', e: '#2f8f3a', E: '#1d5a24',
};
// Spielerhubschrauber (von oben), eigener Entwurf: roter Rumpf, weiße Stummelflügel, Doppelkufen
const SPR = {
  player: sprite([
    '......kkk......',
    '.....krrrk.....',
    '....krgggrk....',
    '....krgGgrk....',
    '....krrrrrk....',
    '.kkkkrrrrrkkkk.',
    'kwwwkrrwrrkwwwk',
    '.kykkrrwrrkkyk.',
    '....kRrrrRk....',
    '.....kRrRk.....',
    '......krk......',
    '......krk......',
    '......krk......',
    '.....kkrkk.....',
    '....kwwkwwk....',
    '.....kk.kk.....',
  ], PAL),
  tank: sprite([
    'tt.oooooo.tt',
    'tdtoOOOOotdt',
    'ttto....ottt',
    'tdto....otdt',
    'ttto....ottt',
    'tdto....otdt',
    'ttto....ottt',
    'tdto....otdt',
    'ttto....ottt',
    'tdtoOOOOotdt',
    'tt.oooooo.tt',
  ], PAL),
  truck: sprite([
    '.kkkkkk.',
    'kSggggSk',
    'kssssssk',
    'kkkkkkkk',
    'kyyyyyyk',
    'kyrrrryk',
    'kyyrryyk',
    'kyyrryyk',
    'kyrrrryk',
    'kyyyyyyk',
    '.kkkkkk.',
  ], PAL),
  jet: sprite([
    '......k......',
    '.....kbk.....',
    '.....kbk.....',
    '....kbgbk....',
    '...kbbbbbk...',
    '..kbbbbbbbk..',
    '.kbbBbbbBbbk.',
    'kbbBBkbkBBbbk',
    'kkkk.kbk.kkkk',
    '.....kbk.....',
    '....kbbbk....',
    '....kk.kk....',
  ], PAL),
  copter: sprite([
    '.....kkk.....',
    '....keeek....',
    '...keggeek...',
    '...keeeeek...',
    '.kkkeeeeekkk.',
    'kEEEkeeekEEEk',
    '.kkkkEeEkkkk.',
    '.....kek.....',
    '.....kek.....',
    '.....kek.....',
    '....kkekk....',
    '....kEkEk....',
  ], PAL),
  boat: sprite([
    '...kk...',
    '..knnk..',
    '.knnnnk.',
    '.knmmnk.',
    'knnmmnnk',
    'knnnnnnk',
    'knmnnmnk',
    'knnnnnnk',
    'knnmmnnk',
    'knnnnnnk',
    'knmnnmnk',
    'knnnnnnk',
    '.knnnnk.',
    '..kkkk..',
  ], PAL),
  bunker: sprite([
    '.kkkkkkkkk.',
    'kssssssssSk',
    'ksSSSSSSSSk',
    'ksS.....SSk',
    'ksS.....SSk',
    'ksS.....SSk',
    'ksS.....SSk',
    'ksS.....SSk',
    'ksSSSSSSSSk',
    'kSSSSSSSSSk',
    '.kkkkkkkkk.',
  ], PAL),
};
const FLASH = {};
Object.keys(SPR).forEach(k => { FLASH[k] = flashOf(SPR[k]); });
// Grafiken aus Draw Things (assets/); bis sie geladen sind – oder wenn eine fehlt – bleiben die Code-Sprites
const ART = { loaded: {} };
function loadArt(file, onload) {
  const im = new Image();
  im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); onload(c); };
  im.src = 'assets/' + file + '.png';
}
[['heli_player', 'player'], ['tank', 'tank'], ['truck', 'truck'], ['boat', 'boat'], ['jet', 'jet'], ['heli_enemy', 'copter'], ['bunker', 'bunker']]
  .forEach(([file, key]) => loadArt(file, c => { SPR[key] = c; FLASH[key] = flashOf(c); ART.loaded[key] = true; }));
['item_power', 'item_bomb', 'item_shield'].forEach(k => loadArt(k, c => { ART[k] = c; }));
function silhouette(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  return c;
}
['boss_destroyer', 'boss_tank', 'boss_bunker', 'boss_heli'].forEach((k, i) => loadArt(k, c => { ART[k] = c; ART[k + '_flash'] = flashOf(c); ART[k + '_shadow'] = silhouette(c); }));

// ---------------------------------------------------------------- Pixelschrift 3x5
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010',
  9: '010101011001110', ' ': '000000000000000', ':': '000010000010000', '-': '000000111000000', '!': '010010010000010',
  '.': '000000000000010', 'x': '000101010101000', '/': '001001010100100',
};
function text(str, x, y, color, scale, align) {
  scale = scale || 1;
  str = String(str).toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
  const w = str.length * 4 * scale - scale;
  if (align === 'center') x -= Math.floor(w / 2); else if (align === 'right') x -= w;
  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? color : 'rgba(0,0,0,.75)';
    const o = pass ? 0 : scale;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[' '];
      for (let b = 0; b < 15; b++) if (g[b] === '1') ctx.fillRect(x + i * 4 * scale + (b % 3) * scale + o, y + Math.floor(b / 3) * scale + o, scale, scale);
    }
  }
}

// ---------------------------------------------------------------- Gelände (Kacheln 8x8)
const T = { GRASS: 0, FOREST: 1, WATER: 2, SAND: 3, ROAD: 4, HROAD: 5, FIELD: 6, ROOF: 7, CONCRETE: 8, BRIDGE: 9, DIRT: 10, RUNWAY: 11, ROOF2: 12, ROCK: 13, DEEP: 14 };
const TILE = [];
function makeTile(fn) { const vs = []; for (let v = 0; v < 3; v++) { const c = document.createElement('canvas'); c.width = c.height = 8; fn(c.getContext('2d'), v); vs.push(c); } return vs; }
function px(x, X, Y, col) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); }
function speck(x, base, cols, n) { x.fillStyle = base; x.fillRect(0, 0, 8, 8); for (let i = 0; i < n; i++) px(x, ri(0, 7), ri(0, 7), cols[ri(0, cols.length - 1)]); }
function buildTiles() {
  seed = 99;
  TILE[T.GRASS] = makeTile(x => speck(x, '#4f8a3a', ['#5e9c46', '#437a31', '#6aa64f'], 7));
  TILE[T.FOREST] = makeTile((x, v) => {
    speck(x, '#2c5e27', ['#24501f'], 4);
    const blobs = [[2, 2], [6, 3], [3, 6], [7, 7]];
    blobs.forEach(([bx, by], i) => { if ((i + v) % 4 === 3) return; x.fillStyle = '#1c4119'; x.fillRect(bx - 1, by, 3, 2); x.fillStyle = '#3f8034'; x.fillRect(bx - 2, by - 2, 3, 3); x.fillStyle = '#58a046'; x.fillRect(bx - 2, by - 2, 1, 1); });
  });
  TILE[T.WATER] = makeTile((x, v) => { speck(x, '#2f6fb0', ['#3b80c4'], 3); x.fillStyle = '#6aa9e2'; x.fillRect((v * 3) % 6, (v * 5) % 7, 2, 1); });
  TILE[T.DEEP] = makeTile((x, v) => { speck(x, '#24589a', ['#2c64a8'], 3); x.fillStyle = '#4d8bcb'; x.fillRect((v * 5) % 6, (v * 3) % 7, 2, 1); });
  TILE[T.SAND] = makeTile(x => speck(x, '#d8c27a', ['#c9b066', '#e6d595'], 6));
  TILE[T.ROAD] = makeTile((x, v) => { speck(x, '#5a5a58', ['#666664', '#4f4f4d'], 5); x.fillStyle = '#3c3c3a'; x.fillRect(0, 0, 1, 8); x.fillRect(7, 0, 1, 8); if (v !== 1) { x.fillStyle = '#d9d2b0'; x.fillRect(3, 1, 2, 4); } });
  TILE[T.HROAD] = makeTile((x, v) => { speck(x, '#5a5a58', ['#666664', '#4f4f4d'], 5); x.fillStyle = '#3c3c3a'; x.fillRect(0, 0, 8, 1); x.fillRect(0, 7, 8, 1); if (v !== 1) { x.fillStyle = '#d9d2b0'; x.fillRect(1, 3, 4, 2); } });
  TILE[T.FIELD] = makeTile(x => { x.fillStyle = '#8f9c3c'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#7a8732'; for (let i = 0; i < 8; i += 2) x.fillRect(0, i, 8, 1); });
  TILE[T.ROOF] = makeTile((x, v) => { x.fillStyle = '#9a4433'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#7d3427'; for (let i = 1; i < 8; i += 2) x.fillRect(0, i, 8, 1); x.fillStyle = '#5a241a'; x.fillRect(v === 2 ? 7 : 0, 0, 1, 8); });
  TILE[T.ROOF2] = makeTile((x, v) => { x.fillStyle = '#6b7684'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#58626e'; for (let i = 0; i < 8; i += 3) x.fillRect(i, 0, 1, 8); x.fillStyle = '#8994a2'; x.fillRect(0, 0, 8, 1); });
  TILE[T.CONCRETE] = makeTile(x => { speck(x, '#8b8b86', ['#7d7d78', '#9a9a95'], 6); x.fillStyle = '#76766f'; x.fillRect(0, 7, 8, 1); x.fillRect(7, 0, 1, 8); });
  TILE[T.BRIDGE] = makeTile(x => { x.fillStyle = '#7d6a4f'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#5f4f39'; for (let i = 1; i < 8; i += 2) x.fillRect(0, i, 8, 1); x.fillStyle = '#3d3326'; x.fillRect(0, 0, 1, 8); x.fillRect(7, 0, 1, 8); });
  TILE[T.DIRT] = makeTile(x => speck(x, '#a8875a', ['#987a50', '#b8966a', '#8c6f48'], 8));
  TILE[T.RUNWAY] = makeTile((x, v) => { speck(x, '#3f3f3d', ['#474745'], 4); if (v === 0) { x.fillStyle = '#e6e2d0'; x.fillRect(3, 0, 2, 5); } });
  TILE[T.ROCK] = makeTile(x => { speck(x, '#a8875a', ['#987a50'], 4); x.fillStyle = '#6e6458'; x.fillRect(1, 2, 5, 4); x.fillStyle = '#8e8476'; x.fillRect(2, 2, 3, 2); x.fillStyle = '#4a4339'; x.fillRect(1, 6, 5, 1); });
}
buildTiles();

const COLS = W / 8;
const ZR = 290;                         // Reihen je Zone
const THEMES = ['KUESTE', 'WALD', 'INDUSTRIE', 'FLUGFELD'];
let rows = [], rowVar = [], gen = null;

function newGen() {
  return { coast: 9, river: 15, riverW: 3, road: 20, blocks: [], blobs: [] };
}
function genRow(r) {
  const z = Math.floor(r / ZR), th = z % 4, zr = r - z * ZR, g = gen;
  const row = new Uint8Array(COLS), vr = new Uint8Array(COLS);
  for (let i = 0; i < COLS; i++) vr[i] = ri(0, 2);
  // Flecken (Wald, Felder, Felsen ...)
  g.blobs = g.blobs.filter(b => b.r1 >= r);
  if (rnd() < 0.08) { const rad = ri(2, 5); g.blobs.push({ cx: ri(0, COLS - 1), r0: r, r1: r + rad * 2, rad, k: rnd() }); }
  const inBlob = i => g.blobs.find(b => { const cy = b.r0 + b.rad; return (i - b.cx) ** 2 + (r - cy) ** 2 <= b.rad * b.rad; });

  if (th === 0) {                       // Küste: Meer links, am Zonenende nur noch Meer
    g.coast = clamp(g.coast + ri(-1, 1), 4, 13);
    let coast = g.coast;
    if (zr > ZR - 80) coast = Math.min(COLS, coast + Math.floor((zr - (ZR - 80)) / 3));
    for (let i = 0; i < COLS; i++) {
      if (i < coast - 3) row[i] = T.DEEP;
      else if (i < coast) row[i] = T.WATER;
      else if (i === coast) row[i] = T.SAND;
      else { const b = inBlob(i); row[i] = b ? (b.k < 0.6 ? T.FOREST : T.FIELD) : T.GRASS; }
    }
    if (rnd() < 0.15) g.road = clamp(g.road + ri(-1, 1), coast + 3, COLS - 3);
    if (coast < COLS - 2) { const rc = clamp(g.road, coast + 2, COLS - 1); row[rc] = T.ROAD; if (g.prev !== undefined && g.prev !== rc && g.prev > coast) row[g.prev] = T.ROAD; g.prev = rc; } else g.prev = undefined;
    village(r, row, coast + 2, COLS);
  } else if (th === 1) {                // Wald mit Fluss und Brücken
    if (rnd() < 0.3) g.river = clamp(g.river + ri(-1, 1), 4, COLS - 6);
    if (rnd() < 0.1) g.riverW = clamp(g.riverW + ri(-1, 1), 2, 4);
    if (rnd() < 0.12) g.road = clamp(g.road + ri(-1, 1), 2, COLS - 3);
    const bridge = zr % 40 === 20;
    for (let i = 0; i < COLS; i++) {
      const b = inBlob(i);
      row[i] = b ? (b.k < 0.5 ? T.GRASS : T.FIELD) : T.FOREST;
      if (i >= g.river && i < g.river + g.riverW) row[i] = T.WATER;
      else if (i === g.river - 1 || i === g.river + g.riverW) row[i] = row[i] === T.FOREST ? T.GRASS : row[i];
    }
    if (bridge) for (let i = 0; i < COLS; i++) row[i] = row[i] === T.WATER ? T.BRIDGE : T.HROAD;
    else {
      const put = c => { row[c] = row[c] === T.WATER ? T.BRIDGE : T.ROAD; };
      put(g.road); if (g.prev !== undefined && g.prev !== g.road) put(g.prev);
    }
    g.prev = g.road;
  } else if (th === 2) {                // Industrie: Straßenraster, Hallen
    const hroad = zr % 22 === 0;
    for (let i = 0; i < COLS; i++) {
      const b = inBlob(i);
      row[i] = b && b.k < 0.25 ? T.GRASS : T.CONCRETE;
      if (i === 6 || i === 22) row[i] = T.ROAD;
      if (hroad) row[i] = T.HROAD;
    }
    if (!hroad) village(r, row, 0, COLS, true);
  } else {                              // Flugfeld: Piste, Hangars, Felsen
    for (let i = 0; i < COLS; i++) {
      const b = inBlob(i);
      row[i] = b ? (b.k < 0.4 ? T.ROCK : T.SAND) : T.DIRT;
      if (i >= 11 && i <= 18) row[i] = T.RUNWAY;
      if (i === 10 || i === 19) row[i] = T.CONCRETE;
    }
    if (zr % 6 === 0) vr.fill(0, 11, 19); else vr.fill(1, 11, 19);
    village(r, row, 0, 9, true); village(r, row, 21, COLS, true);
  }
  rows[r] = row; rowVar[r] = vr;
  spawnGround(r, row, z, th);
}
// Häuser / Hallen als Blöcke über mehrere Reihen
function village(r, row, from, to, hall) {
  const g = gen;
  g.blocks = g.blocks.filter(b => b.r1 >= r);
  if (rnd() < (hall ? 0.06 : 0.04) && to - from > 5) {
    const w = ri(2, hall ? 6 : 3), x0 = ri(from, Math.max(from, to - w - 1));
    g.blocks.push({ x0, x1: x0 + w, r1: r + ri(2, hall ? 5 : 3), t: hall ? (rnd() < 0.5 ? T.ROOF2 : T.ROOF) : T.ROOF });
  }
  g.blocks.forEach(b => { for (let i = b.x0; i <= b.x1 && i < to; i++) if (i >= from && row[i] !== T.ROAD && row[i] !== T.WATER) row[i] = b.t; });
}
const tileAt = (r, c) => (rows[r] ? rows[r][c] : T.GRASS);

// ---------------------------------------------------------------- Spielzustand
let G = null;
const SPEED = 30;                       // Scrollgeschwindigkeit px/s
function newGame() {
  seed = (Math.random() * 2 ** 32) >>> 0;
  rows = []; rowVar = []; gen = newGen();
  G = {
    t: 0, cam: 0, genTo: -1, zone: 0, loop: 0, bossOn: null, bossDone: -1, banner: null,
    score: 0, lives: 3, bombs: 3, nextLife: 50000,
    p: { x: W / 2, y: H - 70, inv: 2.5, level: 1, shield: false, cool: 0, dead: 0 },
    shots: [], eshots: [], foes: [], fx: [], items: [], decals: [], wave: 2.5, bomb: null, shake: 0, kills: 0,
  };
  ensureRows();
  banner('ZONE 1: ' + THEMES[0]);
}
function banner(t) { G.banner = { t, life: 2.6 }; }
function ensureRows() {
  const need = Math.ceil((G.cam + H) / 8) + 6;
  while (G.genTo < need) genRow(++G.genTo);
}
// Bildschirm-y eines Bodenpunkts (Welt-Abstand d vom Start)
const gy = d => H - (d - G.cam);
const diff = () => 1 + G.loop * 0.35 + (G.zone % 4) * 0.08;

// ---------------------------------------------------------------- Gegner
function spawnGround(r, row, z, th) {
  if (r < 30 || !G) return;
  const zr = r - z * ZR;
  if (zr > ZR - 40) return;            // vor dem Endgegner frei
  const d = r * 8 + 4, p = 0.13 * (1 + G.loop * 0.3);
  if (rnd() > p) return;
  const cands = [];
  for (let i = 1; i < COLS - 1; i++) cands.push(i);
  const c = cands[ri(0, cands.length - 1)], t = row[c], x = c * 8 + 4;
  if (t === T.WATER || t === T.DEEP) { if (rnd() < 0.7) addFoe('boat', x, d); return; }
  if (t === T.ROOF || t === T.ROOF2 || t === T.CONCRETE) { addFoe(rnd() < 0.7 ? 'bunker' : 'tank', x, d); return; }
  if (t === T.FOREST && rnd() < 0.6) return;
  addFoe(rnd() < 0.12 ? 'truck' : 'tank', x, d);
}
const FOE = {
  tank: { hp: 3, r: 6, score: 200, ground: true, fire: 2.2 },
  truck: { hp: 2, r: 5, score: 150, ground: true, fire: 0, drop: true },
  boat: { hp: 4, r: 6, score: 300, ground: true, fire: 2.0 },
  bunker: { hp: 6, r: 6, score: 400, ground: true, fire: 2.6 },
  jet: { hp: 1, r: 6, score: 120, fire: 1.4 },
  copter: { hp: 4, r: 7, score: 300, fire: 1.3 },
};
function addFoe(type, x, d, extra) {
  const f = Object.assign({ type, x, d, y: 0, hp: Math.ceil(FOE[type].hp * (1 + G.loop * 0.4)), cool: rr(0.6, 1.8), flash: 0, t: 0, ang: Math.PI / 2, dx: 0 }, extra || {});
  if (type === 'tank' || type === 'truck') f.dx = rnd() < 0.5 ? rr(-6, 6) : 0;
  if (type === 'boat') f.dx = rr(-8, 8);
  G.foes.push(f);
  return f;
}
function spawnWave() {
  const n = G.zone % 4 === 3 ? 5 : 4;
  if (rnd() < 0.62) {
    const side = rnd() < 0.5 ? -1 : 1, x0 = rr(40, W - 40);
    for (let i = 0; i < n; i++) addFoe('jet', x0, 0, { y: -16 - i * 18, air: true, vx: 0, vy: rr(70, 90) * (1 + G.loop * 0.1), side, phase: i * 0.4 });
  } else {
    const k = rnd() < 0.5 ? 1 : 2;
    for (let i = 0; i < k; i++) addFoe('copter', rr(30, W - 30), 0, { y: -20 - i * 30, air: true, stopY: rr(60, H * 0.4), stay: rr(2.5, 4) });
  }
}
function aimShot(x, y, speed, spread) {
  const a = Math.atan2(G.p.y - y, G.p.x - x) + (spread || 0);
  G.eshots.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 2 });
}
const bulletSpeed = () => 62 + 16 * G.loop + (G.zone % 4) * 4;

// ---------------------------------------------------------------- Endgegner
const BOSSES = [
  { art: 'boss_destroyer', name: 'ZERSTOERER', w: 50, h: 120, hp: 220, guns: [[0, -38], [0, 2], [0, 38]], pats: ['aimed', 'fan', 'aimed', 'ring'], move: 'sway', draw: drawDestroyer },
  { art: 'boss_tank', name: 'FESTUNGSPANZER', w: 64, h: 70, hp: 260, guns: [[-16, 22], [16, 22]], pats: ['fan', 'aimed', 'stream'], move: 'creep', draw: drawBigTank },
  { art: 'boss_bunker', name: 'BUNKERWERK', w: 120, h: 64, hp: 320, guns: [[-44, 4], [44, 4], [0, 14]], pats: ['ring', 'aimed', 'fan', 'stream'], move: 'none', draw: drawBunkerBoss },
  { art: 'boss_heli', name: 'STURMBRECHER', w: 76, h: 60, hp: 300, guns: [[-26, 14], [26, 14], [0, 22]], pats: ['stream', 'fan', 'ring', 'aimed'], move: 'fly', draw: drawBossHeli },
];
function startBoss() {
  const def = BOSSES[G.zone % 4];
  G.bossOn = { def, x: W / 2, y: -def.h, ty: def.move === 'fly' ? 80 : 96, hp: Math.round(def.hp * (1 + G.loop * 0.5)), max: 0, t: 0, pat: 0, patT: 0, fireT: 0, flash: 0, rot: 0, dying: 0 };
  G.bossOn.max = G.bossOn.hp;
  banner('ACHTUNG: ' + def.name);
  AUDIO.sfx('alarm'); AUDIO.boss(true);
}
function updateBoss(dt) {
  const b = G.bossOn; if (!b) return;
  b.t += dt; b.flash = Math.max(0, b.flash - dt);
  if (b.dying) {
    b.dying -= dt;
    if (rnd() < 0.5) boom(b.x + rr(-b.def.w / 2, b.def.w / 2), b.y + rr(-b.def.h / 2, b.def.h / 2), rr(6, 14));
    if (b.dying <= 0) {
      boom(b.x, b.y, 30); G.shake = 0.6; AUDIO.sfx('bigboom');
      addScore(8000 * (1 + G.loop));
      G.decals.push({ x: b.x, d: G.cam + (H - b.y), r: 24 });
      G.bossOn = null; G.bossDone = G.zone; G.zone++;
      if (G.zone % 4 === 0) G.loop++;
      banner(`ZONE ${G.zone + 1}: ${THEMES[G.zone % 4]}`);
      AUDIO.boss(false);
      if (rnd() < 1) dropItem(b.x, b.y, 'P');
    }
    return;
  }
  // Bewegung
  if (b.y < b.ty) b.y += 30 * dt;
  const m = b.def.move;
  if (m === 'sway') b.x = W / 2 + Math.sin(b.t * 0.5) * 50;
  if (m === 'creep') b.x = W / 2 + Math.sin(b.t * 0.7) * 60;
  if (m === 'fly') { b.x = W / 2 + Math.sin(b.t * 0.9) * 70; b.y = b.ty + Math.sin(b.t * 1.7) * 18; }
  if (b.y < b.ty - 4) return;
  // Schussmuster wechseln
  b.patT += dt;
  if (b.patT > 3.2) { b.patT = 0; b.pat = (b.pat + 1) % b.def.pats.length; }
  const pat = b.def.pats[b.pat], sp = bulletSpeed(), rage = b.hp < b.max * 0.4 ? 1.4 : 1;
  b.fireT -= dt * rage;
  if (b.fireT > 0) return;
  const guns = b.def.guns.map(([dx, dy]) => [b.x + dx, b.y + dy]);
  if (pat === 'aimed') { guns.forEach(([x, y]) => { aimShot(x, y, sp * 1.1); }); b.fireT = 0.55; }
  if (pat === 'fan') { const [x, y] = guns[Math.floor(b.t * 2) % guns.length]; for (let k = -3; k <= 3; k++) G.eshots.push({ x, y, vx: Math.sin(k * 0.22) * sp, vy: Math.cos(k * 0.22) * sp, r: 2 }); b.fireT = 1.0; }
  if (pat === 'ring') { const n = 14, o = b.t; for (let k = 0; k < n; k++) { const a = o + k * Math.PI * 2 / n; G.eshots.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp * 0.8, vy: Math.sin(a) * sp * 0.8, r: 2 }); } b.fireT = 1.3; }
  if (pat === 'stream') { b.rot += 0.5; const a = Math.PI / 2 + Math.sin(b.rot) * 0.9; guns.forEach(([x, y]) => G.eshots.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 })); b.fireT = 0.16; }
  AUDIO.sfx('eshot');
}
function bossHit(b, dmg) {
  b.hp -= dmg; b.flash = 0.05;
  if (b.hp <= 0 && !b.dying) { b.dying = 1.8; G.eshots = []; }
}

// ---------------------------------------------------------------- Effekte, Punkte, Items
function boom(x, y, size) {
  G.fx.push({ k: 'ring', x, y, r: 2, max: size * 1.4, life: 0.35, t: 0 });
  const n = Math.min(26, 6 + size);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, s = rr(20, 60 + size * 4);
    G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rr(0.3, 0.8), t: 0, c: ['#ffd23f', '#ff8a2a', '#e8452c', '#fff3c0', '#5a5a5a'][ri(0, 4)] });
  }
}
function addScore(n) {
  G.score += n;
  if (G.score >= G.nextLife) { G.lives++; G.nextLife += 70000; banner('EXTRALEBEN!'); AUDIO.sfx('power'); }
}
function dropItem(x, y, k) {
  if (!k) { const q = rnd(); k = q < 0.55 ? 'P' : q < 0.8 ? 'B' : 'S'; }
  G.items.push({ x, y, k, t: 0 });
}
function killFoe(f) {
  const def = FOE[f.type];
  f.dead = true;
  boom(f.x, f.y, def.ground ? 9 : 7);
  if (def.ground) G.decals.push({ x: f.x, d: f.d, r: 6 });
  addScore(def.score * (1 + G.loop));
  AUDIO.sfx('boom');
  G.kills++;
  if (def.drop || (f.type === 'copter' && G.kills % 3 === 0)) dropItem(f.x, f.y);
}

// ---------------------------------------------------------------- Eingabe
const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' && state === 'play') { useBomb(); e.preventDefault(); }
  if ((e.key === 'p' || e.key === 'Escape') && (state === 'play' || state === 'pause')) togglePause();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let drag = null;
cv.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; AUDIO.unlock(); });
addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id || state !== 'play' || G.p.dead) return;
  const k = 1.25 / SCALE;
  G.p.x = clamp(G.p.x + (e.clientX - drag.x) * k, 8, W - 8);
  G.p.y = clamp(G.p.y + (e.clientY - drag.y) * k, 14, H - 12);
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('pointerup', e => { if (drag && e.pointerId === drag.id) drag = null; });
addEventListener('pointercancel', () => { drag = null; });
// das Ziehen soll überall auf dem Bildschirm funktionieren, nicht nur auf der Spielfläche
document.getElementById('wrap').addEventListener('pointerdown', e => { if (e.target !== cv) { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; } });

function useBomb() {
  if (!G || G.bombs <= 0 || G.bomb || G.p.dead) return;
  G.bombs--;
  G.bomb = { x: G.p.x, y: G.p.y, r: 0, t: 0 };
  G.eshots = [];
  G.p.inv = Math.max(G.p.inv, 1.2);
  G.shake = 0.5;
  AUDIO.sfx('bigboom');
}

// ---------------------------------------------------------------- Update
function update(dt) {
  G.t += dt;
  const p = G.p;
  // Kamera
  if (!G.bossOn) {
    G.cam += SPEED * dt;
    const end = (G.zone + 1) * ZR * 8 - H;
    if (G.cam >= end && G.bossDone < G.zone) { G.cam = end; startBoss(); }
  }
  ensureRows();
  // Spieler
  if (p.dead > 0) {
    p.dead -= dt;
    if (p.dead <= 0) {
      if (G.lives <= 0) { gameOver(); return; }
      p.x = W / 2; p.y = H - 70; p.inv = 2.5;
    }
  } else {
    let mx = 0, my = 0;
    if (keys.arrowleft || keys.a) mx--; if (keys.arrowright || keys.d) mx++;
    if (keys.arrowup || keys.w) my--; if (keys.arrowdown || keys.s) my++;
    p.x = clamp(p.x + mx * 110 * dt, 8, W - 8); p.y = clamp(p.y + my * 110 * dt, 14, H - 12);
    p.inv = Math.max(0, p.inv - dt);
    p.cool -= dt;
    if (p.cool <= 0) { fire(); p.cool = p.level >= 2 ? 0.1 : 0.13; }
  }
  // Wellen in der Luft
  if (!G.bossOn) { G.wave -= dt; if (G.wave <= 0) { spawnWave(); G.wave = rr(3.2, 5.5) / (1 + G.loop * 0.2); } }
  // Spielerschüsse
  G.shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; });
  G.shots = G.shots.filter(s => s.y > -10 && s.x > -10 && s.x < W + 10 && !s.hit);
  // Gegner
  const sp = bulletSpeed();
  G.foes.forEach(f => {
    const def = FOE[f.type];
    f.t += dt; f.flash = Math.max(0, f.flash - dt);
    if (def.ground) {
      f.x += f.dx * dt;
      if (f.x < 6 || f.x > W - 6) f.dx = -f.dx;
      f.y = gy(f.d);
      if (f.type === 'tank' || f.type === 'truck') f.d += (f.type === 'truck' ? -8 : -3) * dt;   // fahren dem Spieler entgegen
      f.ang = Math.atan2(p.y - f.y, p.x - f.x);
    } else if (f.type === 'jet') {
      f.y += f.vy * dt;
      f.x += Math.sin(f.t * 2.4 + f.phase) * 60 * dt * f.side;
    } else if (f.type === 'copter') {
      if (f.y < f.stopY && f.stay > 0) f.y += 60 * dt;
      else if (f.stay > 0) { f.stay -= dt; f.x += Math.sin(f.t * 1.5) * 20 * dt; }
      else f.y += 50 * dt;
    }
    // feuern, wenn sichtbar
    if (def.fire && f.y > 6 && f.y < H - 40 && !p.dead) {
      f.cool -= dt * diff();
      if (f.cool <= 0) {
        f.cool = def.fire * rr(0.8, 1.3);
        if (f.type === 'bunker') { for (let k = -1; k <= 1; k++) aimShot(f.x, f.y, sp, k * 0.25); }
        else if (f.type === 'copter') { aimShot(f.x, f.y, sp * 1.1); aimShot(f.x, f.y, sp * 1.1, 0.12); }
        else if (f.type === 'jet') { if (f.y < H * 0.5) aimShot(f.x, f.y, sp * 1.2); }
        else aimShot(f.x, f.y, sp);
        AUDIO.sfx('eshot');
      }
    }
    // Treffer durch Spielerschüsse
    G.shots.forEach(s => {
      if (s.hit || f.dead) return;
      if ((s.x - f.x) ** 2 + (s.y - f.y) ** 2 < (def.r + 2) ** 2) { s.hit = true; f.hp -= s.dmg; f.flash = 0.06; if (f.hp <= 0) killFoe(f); else AUDIO.sfx('hit'); }
    });
    // Zusammenstoß mit Luftgegnern
    if (!def.ground && !f.dead && !p.dead && (f.x - p.x) ** 2 + (f.y - p.y) ** 2 < 100) { killFoe(f); playerHit(); }
  });
  G.foes = G.foes.filter(f => !f.dead && f.y < H + 30 && f.y > -400);
  // Endgegner
  if (G.bossOn) {
    updateBoss(dt);
    const b = G.bossOn;
    if (b && !b.dying) G.shots.forEach(s => {
      if (!s.hit && Math.abs(s.x - b.x) < b.def.w / 2 && Math.abs(s.y - b.y) < b.def.h / 2) { s.hit = true; bossHit(b, s.dmg); AUDIO.sfx('hit'); }
    });
  }
  // gegnerische Schüsse
  G.eshots.forEach(s => {
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (!p.dead && p.inv <= 0 && (s.x - p.x) ** 2 + (s.y - p.y) ** 2 < 16) { s.gone = true; playerHit(); }
  });
  G.eshots = G.eshots.filter(s => !s.gone && s.x > -8 && s.x < W + 8 && s.y > -8 && s.y < H + 8);
  // Items
  G.items.forEach(it => {
    it.t += dt; it.y += 22 * dt; it.x += Math.sin(it.t * 2) * 14 * dt;
    if (!p.dead && (it.x - p.x) ** 2 + (it.y - p.y) ** 2 < 120) { it.got = true; take(it.k); }
  });
  G.items = G.items.filter(it => !it.got && it.y < H + 10);
  // Bombe
  if (G.bomb) {
    const b = G.bomb; b.t += dt; b.r = b.t * 420;
    G.foes.forEach(f => { if (!f.dead && f.y > -10 && f.y < H + 10 && (f.x - b.x) ** 2 + (f.y - b.y) ** 2 < b.r * b.r) { f.hp -= 12; if (f.hp <= 0) killFoe(f); } });
    if (G.bossOn && !G.bossOn.dying && !b.bossHit && b.r > Math.hypot(G.bossOn.x - b.x, G.bossOn.y - b.y)) { b.bossHit = true; bossHit(G.bossOn, 30); }
    G.eshots = [];
    if (b.t > 0.7) G.bomb = null;
  }
  // Effekte
  G.fx.forEach(e => { e.t += dt; if (e.k === 'p') { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.94; e.vy *= 0.94; } if (e.k === 'ring') e.r = e.max * (e.t / e.life); });
  G.fx = G.fx.filter(e => e.t < e.life);
  G.decals = G.decals.filter(dc => gy(dc.d) < H + 30);
  if (G.banner) { G.banner.life -= dt; if (G.banner.life <= 0) G.banner = null; }
  G.shake = Math.max(0, G.shake - dt);
}
function fire() {
  const p = G.p, L = p.level, v = -300;
  const add = (dx, a, dmg) => G.shots.push({ x: p.x + dx, y: p.y - 8, vx: Math.sin(a) * 300, vy: Math.cos(a) * v, dmg: dmg || 1 });
  add(-3, 0); add(3, 0);
  if (L >= 2) { add(-6, -0.08); add(6, 0.08); }
  if (L >= 3) { add(-7, -0.22); add(7, 0.22); }
  if (L >= 4 && Math.floor(G.t * 8) % 2 === 0) { add(-9, -0.42, 2); add(9, 0.42, 2); }
  AUDIO.sfx('shot');
}
function take(k) {
  const p = G.p;
  if (k === 'P') { if (p.level < 4) p.level++; else addScore(2000); banner(p.level < 4 ? 'FEUERKRAFT ' + p.level : 'MAX! +2000'); }
  if (k === 'B') { G.bombs = Math.min(9, G.bombs + 1); banner('BOMBE +1'); }
  if (k === 'S') { p.shield = true; banner('SCHILD'); }
  addScore(500);
  AUDIO.sfx('power');
}
function playerHit() {
  const p = G.p;
  if (p.inv > 0 || p.dead) return;
  if (p.shield) { p.shield = false; p.inv = 1.2; boom(p.x, p.y, 5); AUDIO.sfx('hit'); return; }
  boom(p.x, p.y, 16); G.shake = 0.5; AUDIO.sfx('bigboom');
  G.lives--; p.dead = 1.6; p.level = Math.max(1, p.level - 1); G.bombs = Math.max(G.bombs, 2);
  G.eshots = [];
}

// ---------------------------------------------------------------- Zeichnen
function drawLine(x0, y0, x1, y1, col) {   // pixelgenau (Bresenham)
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy; ctx.fillStyle = col;
  for (let i = 0; i < 64; i++) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function blit(img, x, y, flash) { ctx.drawImage(flash || img, Math.round(x - img.width / 2), Math.round(y - img.height / 2)); }
function shadow(x, y, w, h) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(Math.round(x - w / 2 + 7), Math.round(y - h / 2 + 10), w, h); }
function rotor(x, y, r, t) {
  const a = t * 40;
  ctx.fillStyle = 'rgba(220,230,240,.13)'; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 2; k++) { const b = a + k * Math.PI / 2; drawLine(x - Math.cos(b) * r, y - Math.sin(b) * r, x + Math.cos(b) * r, y + Math.sin(b) * r, 'rgba(30,30,30,.65)'); }
}
function draw(noHud) {
  ctx.save();
  if (G.shake > 0) ctx.translate(Math.round(rr(-3, 3) * G.shake * 2), Math.round(rr(-3, 3) * G.shake * 2));
  // Gelände
  const r0 = Math.floor(G.cam / 8), r1 = Math.ceil((G.cam + H) / 8) + 1;
  const wv = Math.floor(G.t * 2) % 3;
  for (let r = r0; r <= r1; r++) {
    const row = rows[r]; if (!row) continue;
    const y = Math.round(H - (r * 8 + 8 - G.cam));
    for (let c = 0; c < COLS; c++) {
      const t = row[c], v = (t === T.WATER || t === T.DEEP) ? (rowVar[r][c] + wv) % 3 : rowVar[r][c];
      ctx.drawImage(TILE[t][v], c * 8, y);
    }
  }
  // Brandflecken
  G.decals.forEach(dc => { const y = gy(dc.d); ctx.fillStyle = 'rgba(25,20,15,.55)'; ctx.beginPath(); ctx.ellipse(Math.round(dc.x), Math.round(y), dc.r, dc.r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); });
  // Bodengegner
  G.foes.forEach(f => {
    if (!FOE[f.type].ground) return;
    const fl = f.flash > 0;
    if (f.type === 'tank') {
      blit(SPR.tank, f.x, f.y, fl && FLASH.tank);
      if (!ART.loaded.tank) { ctx.fillStyle = fl ? '#fff' : '#55642a'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y) - 3, 6, 6); }
      drawLine(f.x, f.y, f.x + Math.cos(f.ang) * 8, f.y + Math.sin(f.ang) * 8, '#1e2412');
    } else if (f.type === 'bunker') {
      blit(SPR.bunker, f.x, f.y, fl && FLASH.bunker);
      if (!ART.loaded.bunker) { ctx.fillStyle = fl ? '#fff' : '#3f444b'; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 2, 4, 4); }
      drawLine(f.x, f.y, f.x + Math.cos(f.ang) * 7, f.y + Math.sin(f.ang) * 7, '#141414');
    } else if (f.type === 'boat') {
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y) + 7, 6, 2 + Math.floor(G.t * 6) % 2);
      blit(SPR.boat, f.x, f.y, fl && FLASH.boat);
      drawLine(f.x, f.y - 2, f.x + Math.cos(f.ang) * 6, f.y - 2 + Math.sin(f.ang) * 6, '#141414');
    } else blit(SPR[f.type], f.x, f.y, fl && FLASH[f.type]);
  });
  // Endgegner (Boden oder Luft)
  if (G.bossOn) {
    const b = G.bossOn;
    if (b.def.move === 'fly' && !ART[b.def.art]) shadow(b.x, b.y, b.def.w * 0.8, b.def.h * 0.5);
    const pic = ART[b.def.art], fl = b.flash > 0 && Math.floor(G.t * 60) % 4 === 0;
    if (pic) {
      ctx.globalAlpha = b.def.move === 'fly' ? 0.3 : 0.35;
      const off = b.def.move === 'fly' ? 14 : 4;
      ctx.drawImage(ART[b.def.art + '_shadow'], Math.round(b.x - pic.width / 2 + off), Math.round(b.y - pic.height / 2 + off * 1.3));
      ctx.globalAlpha = 1;
      blit(pic, b.x, b.y, fl && ART[b.def.art + '_flash']);
      if (b.def.move === 'fly') rotorBig(b.x, b.y - 4, 34);
      b.def.guns.forEach(([dx, dy]) => { const a = aimA(b.x + dx, b.y + dy); for (let k = 0; k < 2; k++) drawLine(b.x + dx + k, b.y + dy, b.x + dx + k + Math.cos(a) * 9, b.y + dy + Math.sin(a) * 9, '#111'); });
    } else b.def.draw(b);
  }
  // Items
  G.items.forEach(it => {
    const col = it.k === 'P' ? '#e8452c' : it.k === 'B' ? '#ffcc33' : '#4fc3ff';
    const x = Math.round(it.x), y = Math.round(it.y), blink = Math.floor(it.t * 6) % 2;
    const pic = ART[it.k === 'P' ? 'item_power' : it.k === 'B' ? 'item_bomb' : 'item_shield'];
    if (pic) { ctx.drawImage(pic, x - 7, y - 7 + (blink ? -1 : 0)); text(it.k, x - 1, y - 2 + (blink ? -1 : 0), '#fff'); }
    else {
      ctx.fillStyle = '#000'; ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = blink ? '#fff' : col; ctx.fillRect(x - 5, y - 5, 10, 10);
      text(it.k, x - 1, y - 2, blink ? col : '#fff');
    }
  });
  // Luftgegner mit Schatten
  G.foes.forEach(f => { if (!FOE[f.type].ground) shadow(f.x, f.y, 10, 6); });
  G.foes.forEach(f => {
    if (FOE[f.type].ground) return;
    blit(SPR[f.type], f.x, f.y, f.flash > 0 && FLASH[f.type]);
    if (f.type === 'copter') rotor(f.x, f.y - 2, 9, G.t);
  });
  // Spieler
  const p = G.p;
  if (!p.dead && !(p.inv > 0 && Math.floor(G.t * 16) % 2 === 0)) {
    shadow(p.x, p.y, 12, 8);
    blit(SPR.player, p.x, p.y);
    rotor(p.x, p.y - 3, 11, G.t);
    if (p.shield) { ctx.strokeStyle = `rgba(79,195,255,${0.5 + Math.sin(G.t * 10) * 0.3})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(p.x), Math.round(p.y), 13, 0, Math.PI * 2); ctx.stroke(); }
  }
  // Schüsse
  G.shots.forEach(s => { ctx.fillStyle = s.dmg > 1 ? '#7fd8ff' : '#fff6b0'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 3, 2, 5); ctx.fillStyle = '#ffb42a'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) + 2, 2, 1); });
  G.eshots.forEach(s => { const x = Math.round(s.x), y = Math.round(s.y), on = Math.floor(G.t * 12) % 2; ctx.fillStyle = on ? '#ff5a3c' : '#ffd23f'; ctx.fillRect(x - 2, y - 1, 4, 2); ctx.fillRect(x - 1, y - 2, 2, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1); });
  // Explosionen
  G.fx.forEach(e => {
    if (e.k === 'p') { ctx.fillStyle = e.c; const s = e.t < e.life * 0.5 ? 2 : 1; ctx.fillRect(Math.round(e.x), Math.round(e.y), s, s); }
    else { ctx.strokeStyle = `rgba(255,220,120,${1 - e.t / e.life})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.round(e.x), Math.round(e.y), e.r, 0, Math.PI * 2); ctx.stroke(); }
  });
  if (G.bomb) {
    const b = G.bomb;
    ctx.fillStyle = `rgba(255,240,200,${0.35 * (1 - b.t / 0.7)})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(255,255,255,${1 - b.t / 0.7})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  if (!noHud) hud();
}
function hud() {
  text(String(G.score).padStart(7, '0'), 4, 4, '#fff', 1);
  text('HI ' + String(Math.max(hiscore, G.score)).padStart(7, '0'), W / 2, 4, '#ffcc33', 1, 'center');
  // Leben und Bomben unten links
  for (let i = 0; i < Math.min(G.lives, 6); i++) { ctx.drawImage(SPR.player, 4 + i * 11, H - 30, 10, 11); }
  for (let i = 0; i < Math.min(G.bombs, 9); i++) { ctx.fillStyle = '#000'; ctx.fillRect(4 + i * 8, H - 14, 7, 9); ctx.fillStyle = '#ffcc33'; ctx.fillRect(5 + i * 8, H - 13, 5, 7); ctx.fillStyle = '#e8452c'; ctx.fillRect(5 + i * 8, H - 13, 5, 2); }
  text('ZONE ' + (G.zone + 1), 4, 12, '#9fd3ff', 1);
  if (G.bossOn) {
    const b = G.bossOn, w = W - 60;
    ctx.fillStyle = '#000'; ctx.fillRect(29, 14, w + 2, 6);
    ctx.fillStyle = '#e8452c'; ctx.fillRect(30, 15, Math.max(0, w * b.hp / b.max), 4);
    text(b.def.name, W / 2, 22, '#fff', 1, 'center');
  }
  if (G.banner) {
    const a = Math.min(1, G.banner.life * 2);
    ctx.globalAlpha = a;
    text(G.banner.t, W / 2, H * 0.38, '#ffcc33', 2, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- Endgegner-Grafik (per Code)
function px2(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function gun(x, y, len, a, flash) {
  px2(x - 4, y - 4, 8, 8, flash ? '#fff' : '#3d434b'); px2(x - 3, y - 3, 6, 6, flash ? '#fff' : '#59616b');
  drawLine(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, '#111');
  drawLine(x + 1, y, x + 1 + Math.cos(a) * len, y + Math.sin(a) * len, '#111');
}
const aimA = (x, y) => Math.atan2(G.p.y - y, G.p.x - x);
function rotorBig(x, y, r) {
  const a = G.t * 30;
  ctx.fillStyle = 'rgba(220,230,240,.10)'; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 3; k++) { const q = a + k * Math.PI * 2 / 3; drawLine(x, y, x + Math.cos(q) * r, y + Math.sin(q) * r, 'rgba(20,20,20,.45)'); }
}
function drawDestroyer(b) {
  const x = b.x, y = b.y, f = b.flash > 0 && Math.floor(G.t * 60) % 4 === 0;
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(Math.round(x) - 18, Math.round(y) + 58, 36, 4);
  ctx.fillStyle = f ? '#fff' : '#6d747d';
  ctx.beginPath(); ctx.moveTo(x, y - 62); ctx.lineTo(x + 22, y - 30); ctx.lineTo(x + 24, y + 50); ctx.lineTo(x + 14, y + 60); ctx.lineTo(x - 14, y + 60); ctx.lineTo(x - 24, y + 50); ctx.lineTo(x - 22, y - 30); ctx.closePath(); ctx.fill();
  px2(x - 14, y - 20, 28, 26, f ? '#fff' : '#8a929c'); px2(x - 9, y - 14, 18, 12, f ? '#fff' : '#a9b1bb');
  px2(x - 4, y + 12, 8, 14, '#2c2f33'); px2(x - 3, y + 13, 6, 3, '#4d5258');
  for (let i = -40; i <= 44; i += 12) px2(x - 18, y + i, 2, 6, '#4d545c');
  b.def.guns.forEach(([dx, dy]) => gun(x + dx, y + dy, 9, aimA(x + dx, y + dy), f));
}
function drawBigTank(b) {
  const x = b.x, y = b.y, f = b.flash > 0 && Math.floor(G.t * 60) % 4 === 0;
  px2(x - 32, y - 35, 12, 70, '#262620'); px2(x + 20, y - 35, 12, 70, '#262620');
  for (let i = -34; i < 34; i += 4) { px2(x - 31, y + i + (Math.floor(G.t * 8) % 4), 10, 1, '#4a4a40'); px2(x + 21, y + i + (Math.floor(G.t * 8) % 4), 10, 1, '#4a4a40'); }
  px2(x - 22, y - 32, 44, 64, f ? '#fff' : '#5d6b2c'); px2(x - 18, y - 28, 36, 56, f ? '#fff' : '#6f7f36');
  px2(x - 14, y - 12, 28, 26, f ? '#fff' : '#4e5a24');
  b.def.guns.forEach(([dx, dy]) => { const a = aimA(x + dx, y + dy); px2(x + dx - 5, y + dy - 5, 10, 10, f ? '#fff' : '#3c4519'); for (let k = 0; k < 3; k++) drawLine(x + dx + k - 1, y + dy, x + dx + k - 1 + Math.cos(a) * 14, y + dy + Math.sin(a) * 14, '#111'); });
}
function drawBunkerBoss(b) {
  const x = b.x, y = b.y, f = b.flash > 0 && Math.floor(G.t * 60) % 4 === 0;
  px2(x - 60, y - 32, 120, 64, f ? '#fff' : '#6b6f68'); px2(x - 56, y - 28, 112, 56, f ? '#fff' : '#83877f');
  for (let i = -52; i < 52; i += 8) px2(x + i, y - 28, 1, 56, '#73776f');
  px2(x - 16, y - 16, 32, 32, f ? '#fff' : '#3c3f3a');
  const pulse = 0.5 + Math.sin(G.t * 6) * 0.5;
  ctx.fillStyle = `rgba(255,${Math.round(80 + pulse * 120)},40,1)`; ctx.fillRect(Math.round(x) - 6, Math.round(y) - 6, 12, 12);
  b.def.guns.forEach(([dx, dy]) => gun(x + dx, y + dy, 10, aimA(x + dx, y + dy), f));
}
function drawBossHeli(b) {
  const x = b.x, y = b.y, f = b.flash > 0 && Math.floor(G.t * 60) % 4 === 0;
  px2(x - 38, y + 6, 76, 8, f ? '#fff' : '#2b3a2a');                          // Stummelflügel
  px2(x - 40, y + 4, 10, 14, '#1b241b'); px2(x + 30, y + 4, 10, 14, '#1b241b');  // Raketenbehälter
  px2(x - 12, y - 24, 24, 44, f ? '#fff' : '#3d5a3a'); px2(x - 8, y - 28, 16, 8, f ? '#fff' : '#3d5a3a');
  px2(x - 6, y - 20, 12, 10, '#7fd8ff'); px2(x - 4, y - 18, 4, 4, '#d8f4ff');
  px2(x - 3, y + 20, 6, 22, f ? '#fff' : '#2b3a2a'); px2(x - 10, y + 38, 20, 4, '#2b3a2a');
  const a = G.t * 30;
  ctx.fillStyle = 'rgba(220,230,240,.12)'; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y - 4), 36, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 3; k++) { const q = a + k * Math.PI * 2 / 3; drawLine(x, y - 4, x + Math.cos(q) * 36, y - 4 + Math.sin(q) * 36, 'rgba(20,20,20,.6)'); }
  b.def.guns.forEach(([dx, dy]) => gun(x + dx, y + dy, 7, aimA(x + dx, y + dy), f));
}

// ---------------------------------------------------------------- Klang (Web Audio, eigene Chiptunes)
const AUDIO = (() => {
  let ac = null, master, musicG, sfxG, noise, on = true, music = null, bossMode = false, lastShot = 0;
  try { on = localStorage.getItem('rotorsturm-ton') !== 'aus'; } catch (e) { /* privat */ }
  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC(); master = ac.createGain(); master.gain.value = on ? 0.7 : 0; master.connect(ac.destination);
      musicG = ac.createGain(); musicG.gain.value = 0.32; musicG.connect(master);
      sfxG = ac.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  }
  const mid = n => 440 * Math.pow(2, (n - 69) / 12);
  function tone(type, f0, f1, t, dur, vol, bus) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  function hiss(t, dur, vol, freq, bus) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(80, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function sfx(k) {
    if (!ac || !on || ac.state !== 'running') return;
    const t = ac.currentTime;
    if (k === 'shot') { if (t - lastShot < 0.09) return; lastShot = t; tone('square', 1400, 500, t, 0.05, 0.035); }
    if (k === 'eshot') tone('square', 600, 300, t, 0.06, 0.02);
    if (k === 'hit') tone('square', 300, 200, t, 0.03, 0.03);
    if (k === 'boom') { hiss(t, 0.35, 0.4, 2500); tone('triangle', 160, 50, t, 0.3, 0.25); }
    if (k === 'bigboom') { hiss(t, 1.0, 0.6, 1800); tone('triangle', 110, 30, t, 0.9, 0.4); }
    if (k === 'power') [72, 76, 79, 84].forEach((n, i) => tone('square', mid(n), 0, t + i * 0.06, 0.12, 0.06));
    if (k === 'alarm') for (let i = 0; i < 4; i++) { tone('square', 880, 660, t + i * 0.3, 0.25, 0.05); }
  }
  // Musik: eigene Chiptune-Schleife in a-Moll (Bass, Melodie, Rauschen als Hi-Hat)
  const BASS = [45, 45, 57, 45, 45, 57, 45, 52, 41, 41, 53, 41, 41, 53, 41, 48, 43, 43, 55, 43, 43, 55, 43, 50, 40, 40, 52, 40, 44, 47, 52, 44];
  const LEAD = [69, 0, 72, 76, 0, 74, 72, 71, 69, 0, 65, 69, 72, 0, 69, 0, 71, 0, 74, 79, 0, 77, 76, 74, 76, 0, 0, 68, 71, 0, 76, 0,
    81, 0, 79, 76, 0, 74, 76, 0, 77, 0, 76, 74, 72, 0, 69, 0, 74, 0, 72, 71, 0, 67, 71, 74, 76, 0, 75, 76, 0, 0, 0, 0];
  const BOSSL = [69, 70, 69, 0, 69, 70, 72, 0, 68, 69, 68, 0, 68, 69, 71, 0];
  function startMusic() {
    if (!ac || music) return;
    let step = 0, next = ac.currentTime + 0.1;
    music = setInterval(() => {
      const spb = bossMode ? 0.105 : 0.125;
      while (next < ac.currentTime + 0.3) {
        const b = BASS[step % 32] + (bossMode ? 1 : 0);
        tone('triangle', mid(b), 0, next, spb * 0.9, 0.22, musicG);
        const l = bossMode ? BOSSL[step % 16] + 12 : LEAD[step % 64];
        if (l) tone('square', mid(l), 0, next, spb * (bossMode ? 0.8 : 1.6), 0.07, musicG);
        if (step % 2 === 1) hiss(next, 0.04, 0.08, 9000, musicG);
        if (step % 8 === 0) tone('sine', 120, 40, next, 0.15, 0.3, musicG);
        next += spb; step++;
      }
    }, 60);
  }
  function stopMusic() { clearInterval(music); music = null; }
  return {
    unlock, sfx,
    play() { unlock(); if (on) startMusic(); },
    stop: stopMusic,
    boss(b) { bossMode = b; },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('rotorsturm-ton', on ? 'an' : 'aus'); } catch (e) { /* privat */ } if (master) master.gain.value = on ? 0.7 : 0; if (on && state === 'play') startMusic(); return on; },
  };
})();

// ---------------------------------------------------------------- Ablauf
let state = 'title', hiscore = 0, last = 0;
try { hiscore = +localStorage.getItem('rotorsturm-hi') || 0; } catch (e) { /* privat */ }
const $ = id => document.getElementById(id);
function show(id) { ['title', 'pause', 'over'].forEach(k => { $(k).hidden = k !== id; }); const play = !id; $('bombBtn').style.display = play ? 'block' : 'none'; $('pauseBtn').style.display = play ? 'block' : 'none'; }
function start() { AUDIO.unlock(); newGame(); state = 'play'; show(null); AUDIO.boss(false); AUDIO.play(); }
function togglePause() { if (state === 'play') { state = 'pause'; show('pause'); AUDIO.stop(); } else if (state === 'pause') { state = 'play'; show(null); AUDIO.play(); last = performance.now(); } }
function gameOver() {
  state = 'over'; AUDIO.stop();
  if (G.score > hiscore) { hiscore = G.score; try { localStorage.setItem('rotorsturm-hi', hiscore); } catch (e) { /* privat */ } }
  $('finalScore').textContent = String(G.score).padStart(7, '0');
  $('hiOver').textContent = 'REKORD ' + String(hiscore).padStart(7, '0') + ' · ZONE ' + (G.zone + 1);
  show('over');
}
function titleHi() { $('hiTitle').textContent = hiscore ? 'REKORD ' + String(hiscore).padStart(7, '0') : ''; $('sound').textContent = 'TON: ' + (AUDIO.on ? 'AN' : 'AUS'); }
$('start').onclick = start;
$('again').onclick = start;
$('resume').onclick = togglePause;
$('quit').onclick = () => { state = 'title'; titleHi(); show('title'); };
$('sound').onclick = () => { AUDIO.unlock(); AUDIO.toggle(); titleHi(); };
$('pauseBtn').onclick = togglePause;
$('bombBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); useBomb(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); });
titleHi();

// Titel-Hintergrund: Gelände scrollt langsam vorbei
function attract(dt) {
  if (!G) { newGame(); G.p.dead = 99; G.lives = 0; }
  G.t += dt; G.cam += 18 * dt; ensureRows();
  G.p.dead = 99;
  draw(true);
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (state === 'play') { update(dt); if (state === 'play') draw(); }
  else if (state === 'title') attract(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Testzugang für automatische Prüfungen (unsichtbar im Spiel)
window.__rotor = { get G() { return G; }, get state() { return state; }, start, update: dt => update(dt) };
