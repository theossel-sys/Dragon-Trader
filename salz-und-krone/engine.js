/* Salz & Krone – Spiellogik (ohne Oberfläche, läuft auch in Node für Tests).
 * Ein eigenes Wirtschaftsspiel: Seehandel zwischen Hansestädten und Aufbau eines eigenen Lehens. */
(function (root) {
  'use strict';

  // ---------- Daten ----------
  const SEASONS = ['Frühling', 'Sommer', 'Herbst', 'Winter'];

  const GOODS = [
    { id: 'getreide', name: 'Getreide', icon: '🌾', base: 10 },
    { id: 'holz', name: 'Holz', icon: '🪵', base: 8 },
    { id: 'bier', name: 'Bier', icon: '🍺', base: 14 },
    { id: 'salz', name: 'Salz', icon: '🧂', base: 18 },
    { id: 'hering', name: 'Hering', icon: '🐟', base: 22 },
    { id: 'eisen', name: 'Eisen', icon: '⚒️', base: 30 },
    { id: 'tuch', name: 'Tuch', icon: '🧵', base: 45 },
    { id: 'wein', name: 'Wein', icon: '🍷', base: 55 },
    { id: 'pelze', name: 'Pelze', icon: '🦊', base: 75 },
  ];
  const G = {};
  GOODS.forEach(g => { G[g.id] = g; g.target = Math.round(900 / g.base); });

  // x/y auf der Karte (1000 x 640); p = erzeugt (billig), d = gefragt (teuer); frozen = im Winter vereist
  const CITIES = [
    { id: 'bruegge', name: 'Brügge', x: 95, y: 548, p: ['tuch', 'wein'], d: ['pelze', 'hering', 'getreide'] },
    { id: 'bremen', name: 'Bremen', x: 228, y: 508, p: ['bier', 'getreide'], d: ['wein', 'eisen'] },
    { id: 'hamburg', name: 'Hamburg', x: 300, y: 486, p: ['bier', 'tuch'], d: ['holz', 'eisen'] },
    { id: 'luebeck', name: 'Lübeck', x: 438, y: 438, p: ['salz', 'bier'], d: ['hering', 'pelze'] },
    { id: 'bergen', name: 'Bergen', x: 122, y: 138, p: ['hering'], d: ['getreide', 'bier', 'tuch'] },
    { id: 'stockholm', name: 'Stockholm', x: 590, y: 212, p: ['eisen', 'holz'], d: ['salz', 'tuch'], frozen: true },
    { id: 'visby', name: 'Visby', x: 616, y: 296, p: ['holz', 'hering'], d: ['wein', 'bier'] },
    { id: 'danzig', name: 'Danzig', x: 612, y: 432, p: ['getreide', 'holz'], d: ['salz', 'wein'] },
    { id: 'riga', name: 'Riga', x: 772, y: 298, p: ['pelze', 'getreide'], d: ['salz', 'hering'], frozen: true },
    { id: 'reval', name: 'Reval', x: 842, y: 210, p: ['pelze', 'holz'], d: ['tuch', 'salz', 'wein'], frozen: true },
  ];
  const C = {};
  CITIES.forEach(c => { C[c.id] = c; });

  const SHIPS = {
    schnigge: { name: 'Schnigge', cap: 25, speed: 700, price: 700, upkeep: 15, sink: 0.25 },
    kogge: { name: 'Kogge', cap: 60, speed: 560, price: 1600, upkeep: 35, sink: 0.15 },
    holk: { name: 'Holk', cap: 120, speed: 460, price: 3400, upkeep: 60, sink: 0.06 },
  };
  const ARM_PRICE = 400;

  const BUILDINGS = [
    { id: 'muehle', name: 'Mühle', icon: '🌀', price: 900, text: 'Ernte +30 %' },
    { id: 'speicher', name: 'Speicher', icon: '🏚️', price: 1200, text: 'Heimatlager +400 Last' },
    { id: 'markt', name: 'Marktplatz', icon: '🏪', price: 1500, text: 'Steuern +30 %, lockt Zuzug' },
    { id: 'kirche', name: 'Kirche', icon: '⛪', price: 3000, text: 'Ansehen +10, Volk zufriedener' },
    { id: 'mauer', name: 'Stadtmauer', icon: '🧱', price: 3500, text: 'Schutz vor Räubern und Fehden' },
    { id: 'dom', name: 'Dom', icon: '🕍', price: 12000, text: 'Ansehen +20 – Bedingung für den höchsten Rang' },
  ];
  const B = {};
  BUILDINGS.forEach(b => { B[b.id] = b; });

  // eigene Rangleiter: vom Krämer zum Reichsfürsten
  const RANKS = [
    { name: 'Krämer' },
    { name: 'Kaufmann', worth: 5000 },
    { name: 'Ratsherr', worth: 10000, ansehen: 15 },
    { name: 'Bürgermeister', worth: 18000, ansehen: 30, bld: ['markt'] },
    { name: 'Landvogt', worth: 30000, ansehen: 40, land: 250, bld: ['muehle'] },
    { name: 'Graf', worth: 50000, ansehen: 55, pop: 500, bld: ['kirche', 'mauer'] },
    { name: 'Herzog', worth: 80000, ansehen: 70, pop: 1000, soldiers: 40 },
    { name: 'Reichsfürst', worth: 130000, ansehen: 85, bld: ['dom'] },
  ];

  const COLORS = ['#b3261e', '#1f5fa8', '#2e7d32', '#8e44ad'];
  const SHIP_NAMES = ['Seeadler', 'Möwe', 'Hoffnung', 'Sankt Jürgen', 'Graue Gans', 'Nordstern', 'Gute Fahrt',
    'Wilde Ente', 'Marienkrone', 'Salzbraut', 'Kranich', 'Bunte Kuh', 'Ostwind', 'Silberling', 'Treue Hand',
    'Lachs', 'Fortuna', 'Sturmvogel', 'Heringsfänger', 'Morgenröte'];

  const START_YEAR = 1370;
  const HOME_CAP = 300;
  const KONTOR_CAP = 150;
  const KONTOR_PRICE = 1500;
  const KONTOR_UPKEEP = 25;
  const SOLDIER_PRICE = 40;
  const SOLDIER_UPKEEP = 3;
  const LAND_PRICE = 14;
  const GRAIN_PER_HEAD = 0.3;      // Last Getreide pro Kopf und Jahr
  const YIELD = 0.6;               // Last pro Morgen und Jahr bei normalem Wetter

  // ---------- Hilfen ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rng(state) {            // mulberry32, im Spielstand gespeichert
    let t = (state.seed = (state.seed + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const pick = (s, arr) => arr[Math.floor(rng(s) * arr.length)];
  const dist = (a, b) => Math.hypot(C[a].x - C[b].x, C[a].y - C[b].y);

  // ---------- Neues Spiel ----------
  function newGame(opts) {
    const s = {
      v: 1, seed: (opts.seed >>> 0) || ((Math.random() * 2 ** 32) >>> 0),
      round: 0, cur: 0, step: 0, years: opts.years || 15, weather: 1, over: false, winner: null,
      cities: {}, players: [], log: [], shipNo: 0,
    };
    CITIES.forEach(c => {
      const m = {};
      GOODS.forEach(g => {
        const mod = c.p.includes(g.id) ? 0.6 : c.d.includes(g.id) ? 1.5 : 1;
        const stock = g.target * (mod < 1 ? 1.6 : mod > 1 ? 0.5 : 1) * (0.8 + rng(s) * 0.4);
        m[g.id] = { mod, stock, target: g.target };
      });
      s.cities[c.id] = m;
    });
    const freeHomes = CITIES.map(c => c.id);
    opts.players.forEach((p, i) => {
      let home = p.home;
      if (!home || !freeHomes.includes(home)) home = freeHomes[Math.floor(rng(s) * freeHomes.length)];
      freeHomes.splice(freeHomes.indexOf(home), 1);
      const pl = {
        id: i, name: p.name || 'Spieler ' + (i + 1), ai: !!p.ai, color: COLORS[i % COLORS.length], home,
        gold: 1200, land: 50, pop: 80, tax: 20, ansehen: 10, rank: 0, soldiers: 0, buildings: {},
        kontore: { [home]: emptyGoods() }, ships: [], harvest: 0, annualDue: false, alive: true, stats: [],
      };
      pl.kontore[home].getreide = 30;
      addShip(s, pl, 'kogge', home);
      s.players.push(pl);
    });
    log(s, null, `Das Jahr ${START_YEAR} beginnt. Möge der Handel gedeihen!`);
    return s;
  }
  function emptyGoods() { const o = {}; GOODS.forEach(g => { o[g.id] = 0; }); return o; }
  function addShip(s, pl, type, city) {
    const used = pl.ships.map(x => x.name);
    let name = SHIP_NAMES[(s.shipNo++ * 7 + pl.id * 3) % SHIP_NAMES.length];
    if (used.includes(name)) name += ' II';
    const sh = { id: 's' + s.shipNo, name, type, at: city, to: null, left: 0, cargo: emptyGoods(), armed: false };
    pl.ships.push(sh);
    return sh;
  }

  // ---------- Abfragen ----------
  const season = s => s.round % 4;
  const year = s => START_YEAR + Math.floor(s.round / 4);
  const seasonName = s => SEASONS[season(s)];
  const isFrozen = (s, city) => season(s) === 3 && !!C[city].frozen;
  const load = goods => GOODS.reduce((a, g) => a + goods[g.id], 0);
  const capOf = (pl, holder) => holder.type ? SHIPS[holder.type].cap
    : holder === pl.kontore[pl.home] ? HOME_CAP + (pl.buildings.speicher ? 400 : 0) : KONTOR_CAP;

  function price(s, city, g) {
    const m = s.cities[city][g];
    const f = Math.pow(m.target / Math.max(m.stock, 1), 0.5);
    return G[g].base * m.mod * clamp(f, 0.45, 2.6);
  }
  const buyPrice = (s, city, g) => Math.ceil(price(s, city, g) * 1.06);
  const sellPrice = (s, city, g) => Math.max(1, Math.floor(price(s, city, g) * 0.94));

  // Kosten / Erlös für q Einheiten (Preis ändert sich mit jeder Einheit)
  function quote(s, city, g, q, sell) {
    const m = s.cities[city][g], keep = m.stock;
    let sum = 0, n = 0;
    for (; n < q; n++) {
      if (!sell && m.stock < 1) break;
      sum += sell ? sellPrice(s, city, g) : buyPrice(s, city, g);
      m.stock += sell ? 1 : -1;
    }
    m.stock = keep;
    return { sum, n };
  }

  function worth(s, pl) {
    let w = pl.gold + pl.land * 12 + pl.soldiers * 20;
    const inv = goods => GOODS.reduce((a, g) => a + goods[g.id] * g.base, 0);
    Object.keys(pl.kontore).forEach(k => { w += inv(pl.kontore[k]); if (k !== pl.home) w += KONTOR_PRICE * 0.5; });
    pl.ships.forEach(sh => { w += inv(sh.cargo) + SHIPS[sh.type].price * 0.6 + (sh.armed ? ARM_PRICE * 0.5 : 0); });
    BUILDINGS.forEach(b => { if (pl.buildings[b.id]) w += b.price * 0.5; });
    return Math.round(w);
  }

  function rankCheck(s, pl, r) {
    const R = RANKS[r], w = worth(s, pl), out = [];
    if (R.worth) out.push({ t: `Vermögen ${fmt(R.worth)}`, ok: w >= R.worth });
    if (R.ansehen) out.push({ t: `Ansehen ${R.ansehen}`, ok: pl.ansehen >= R.ansehen });
    if (R.land) out.push({ t: `${R.land} Morgen Land`, ok: pl.land >= R.land });
    if (R.pop) out.push({ t: `${R.pop} Untertanen`, ok: pl.pop >= R.pop });
    if (R.soldiers) out.push({ t: `${R.soldiers} Soldaten`, ok: pl.soldiers >= R.soldiers });
    (R.bld || []).forEach(b => out.push({ t: B[b].name, ok: !!pl.buildings[b] }));
    return out;
  }
  const fmt = n => Math.round(n).toLocaleString('de-DE');

  // ---------- Aktionen (geben Fehlertext oder null zurück) ----------
  // holder: {kind:'ship', id} oder {kind:'kontor', city}
  function holderObj(pl, h) {
    return h.kind === 'ship' ? pl.ships.find(x => x.id === h.id) : pl.kontore[h.city];
  }
  function holderCity(pl, h) { return h.kind === 'ship' ? holderObj(pl, h).at : h.city; }
  function holderGoods(pl, h) { const o = holderObj(pl, h); return h.kind === 'ship' ? o.cargo : o; }

  function buy(s, pl, h, g, q) {
    const o = holderObj(pl, h), city = holderCity(pl, h);
    if (!o || !city) return 'Nicht im Hafen.';
    const goods = holderGoods(pl, h);
    const room = (h.kind === 'ship' ? SHIPS[o.type].cap : capOf(pl, o)) - load(goods);
    q = Math.min(q, room);
    if (q <= 0) return 'Kein Platz mehr.';
    // so viel wie das Gold reicht
    let qt = quote(s, city, g, q, false);
    while (qt.n > 0 && qt.sum > pl.gold) qt = quote(s, city, g, qt.n - 1, false);
    if (qt.n <= 0) return pl.gold <= 0 ? 'Kein Gold.' : 'Ausverkauft.';
    pl.gold -= qt.sum;
    s.cities[city][g].stock -= qt.n;
    goods[g] += qt.n;
    return null;
  }
  function sell(s, pl, h, g, q) {
    const city = holderCity(pl, h), goods = holderGoods(pl, h);
    if (!city) return 'Nicht im Hafen.';
    q = Math.min(q, goods[g]);
    if (q <= 0) return 'Nichts zu verkaufen.';
    const qt = quote(s, city, g, q, true);
    pl.gold += qt.sum;
    s.cities[city][g].stock += qt.n;
    goods[g] -= qt.n;
    return null;
  }
  function transfer(pl, from, to, g, q) {
    const a = holderGoods(pl, from), b = holderGoods(pl, to), bo = holderObj(pl, to);
    const room = (to.kind === 'ship' ? SHIPS[bo.type].cap : capOf(pl, bo)) - load(b);
    q = Math.min(q, a[g], room);
    if (q <= 0) return 'Kein Platz oder keine Ware.';
    a[g] -= q; b[g] += q;
    return null;
  }
  function travelTime(sh, from, to) { return Math.max(1, Math.ceil(dist(from, to) / SHIPS[sh.type].speed)); }
  function sail(s, pl, shipId, to) {
    const sh = pl.ships.find(x => x.id === shipId);
    if (!sh || !sh.at) return 'Das Schiff ist auf See.';
    if (sh.at === to) return 'Das Schiff liegt schon dort.';
    if (isFrozen(s, sh.at)) return `${C[sh.at].name} ist zugefroren.`;
    if (isFrozen(s, to)) return `${C[to].name} ist zugefroren.`;
    sh.to = to; sh.left = travelTime(sh, sh.at, to); sh.from = sh.at; sh.at = null;
    return null;
  }
  function buyShip(s, pl, type) {
    const T = SHIPS[type];
    if (pl.gold < T.price) return 'Nicht genug Gold.';
    if (isFrozen(s, pl.home)) return 'Die Werft ist zugefroren.';
    pl.gold -= T.price;
    const sh = addShip(s, pl, type, pl.home);
    log(s, pl, `lässt die ${T.name} „${sh.name}“ vom Stapel.`);
    return null;
  }
  function sellShip(s, pl, shipId) {
    const sh = pl.ships.find(x => x.id === shipId);
    if (!sh || !sh.at) return 'Nur im Hafen möglich.';
    if (pl.ships.length <= 1) return 'Dein letztes Schiff behältst du.';
    if (load(sh.cargo) > 0) return 'Erst die Ladung löschen.';
    pl.gold += Math.round(SHIPS[sh.type].price * 0.6);
    pl.ships = pl.ships.filter(x => x !== sh);
    return null;
  }
  function arm(s, pl, shipId) {
    const sh = pl.ships.find(x => x.id === shipId);
    if (!sh || sh.armed) return 'Schon bewaffnet.';
    if (pl.gold < ARM_PRICE) return 'Nicht genug Gold.';
    pl.gold -= ARM_PRICE; sh.armed = true;
    return null;
  }
  function buyKontor(s, pl, city) {
    if (pl.kontore[city]) return 'Hier hast du schon ein Kontor.';
    if (pl.gold < KONTOR_PRICE) return 'Nicht genug Gold.';
    if (!pl.ships.some(sh => sh.at === city)) return 'Dafür muss ein Schiff von dir im Hafen liegen.';
    pl.gold -= KONTOR_PRICE; pl.kontore[city] = emptyGoods();
    pl.ansehen = clamp(pl.ansehen + 2, 0, 100);
    log(s, pl, `eröffnet ein Kontor in ${C[city].name}.`);
    return null;
  }
  function buyLand(s, pl, n) {
    const cost = n * LAND_PRICE;
    if (pl.gold < cost) return 'Nicht genug Gold.';
    pl.gold -= cost; pl.land += n;
    return null;
  }
  function build(s, pl, id) {
    const b = B[id];
    if (pl.buildings[id]) return 'Schon gebaut.';
    if (pl.gold < b.price) return 'Nicht genug Gold.';
    pl.gold -= b.price; pl.buildings[id] = true;
    if (id === 'kirche') pl.ansehen = clamp(pl.ansehen + 10, 0, 100);
    if (id === 'dom') pl.ansehen = clamp(pl.ansehen + 20, 0, 100);
    if (id === 'markt' || id === 'mauer') pl.ansehen = clamp(pl.ansehen + 3, 0, 100);
    log(s, pl, `lässt ${b.name === 'Dom' ? 'einen' : 'eine'} ${b.name} errichten.`);
    return null;
  }
  function hire(s, pl, n) {
    if (n > 0) {
      if (pl.gold < n * SOLDIER_PRICE) return 'Nicht genug Gold.';
      pl.gold -= n * SOLDIER_PRICE; pl.soldiers += n;
    } else pl.soldiers = Math.max(0, pl.soldiers + n);
    return null;
  }
  function donate(s, pl, amount) {
    if (pl.gold < amount) return 'Nicht genug Gold.';
    pl.gold -= amount;
    const gain = Math.max(1, Math.round(amount / (200 + pl.rank * 200)));
    pl.ansehen = clamp(pl.ansehen + gain, 0, 100);
    return null;
  }
  function setTax(pl, t) { pl.tax = clamp(Math.round(t), 0, 50); }

  // Fehde gegen einen anderen Spieler
  function feud(s, pl, targetId) {
    const t = s.players[targetId];
    if (!t || t === pl) return 'Ungültiges Ziel.';
    if (pl.soldiers < 10) return 'Du brauchst mindestens 10 Soldaten.';
    if (pl.feudRound === s.round) return 'Nur eine Fehde pro Jahreszeit.';
    pl.feudRound = s.round;
    const att = pl.soldiers * (0.8 + rng(s) * 0.6);
    const def = t.soldiers * 1.3 * (0.8 + rng(s) * 0.6) + (t.buildings.mauer ? 25 : 0) + 5;
    pl.ansehen = clamp(pl.ansehen - 4, 0, 100);
    if (att > def) {
      const land = Math.round(t.land * 0.2), gold = Math.round(Math.max(0, t.gold) * 0.15);
      t.land -= land; pl.land += land; t.gold -= gold; pl.gold += gold;
      t.soldiers = Math.round(t.soldiers * 0.6); pl.soldiers = Math.round(pl.soldiers * 0.85);
      log(s, pl, `gewinnt eine Fehde gegen ${t.name}: ${land} Morgen Land und ${fmt(gold)} Gold erbeutet.`);
      return { won: true, land, gold };
    }
    pl.soldiers = Math.round(pl.soldiers * 0.6); t.soldiers = Math.round(t.soldiers * 0.85);
    log(s, pl, `verliert eine Fehde gegen ${t.name}.`);
    return { won: false };
  }

  // Jahresabschluss im Herbst: Getreide verteilen, Volk wächst oder schrumpft
  function annual(s, pl, ration) {
    const home = pl.kontore[pl.home];
    ration = clamp(Math.round(ration), 0, home.getreide);
    const need = Math.max(1, pl.pop * GRAIN_PER_HEAD);
    const r = ration / need;
    home.getreide -= ration;
    let g = 0.02;
    if (r >= 1) g += Math.min(0.1, (r - 1) * 0.15);
    else if (r < 0.75) g -= (0.75 - r) * 0.6;
    else g -= (1 - r) * 0.1;
    if (pl.tax > 25) g -= (pl.tax - 25) * 0.006;
    if (pl.tax < 15) g += 0.02;
    if (pl.buildings.markt) g += 0.04;
    if (pl.buildings.kirche) g += 0.02;
    g += (pl.ansehen - 30) * 0.0008;
    const before = pl.pop;
    pl.pop = Math.max(10, Math.round(pl.pop * (1 + g)));
    const cap = pl.land * 2.2 + (pl.buildings.markt ? 150 : 0) + (pl.buildings.mauer ? 100 : 0);
    if (pl.pop > cap) pl.pop = Math.round(cap + (pl.pop - cap) * 0.3);
    let da = 0;
    if (r >= 1) da += 2; else if (r < 0.8) da -= 5;
    if (pl.tax > 30) da -= 3; else if (pl.tax <= 15) da += 1;
    pl.ansehen = clamp(pl.ansehen + da, 0, 100);
    pl.annualDue = false;
    const diff = pl.pop - before;
    return { ration, need: Math.round(need), r, pop: pl.pop, diff, da };
  }
  function suggestedRation(pl) {
    return Math.min(pl.kontore[pl.home].getreide, Math.ceil(pl.pop * GRAIN_PER_HEAD));
  }

  // ---------- Rundenablauf ----------
  function log(s, pl, text) {
    s.log.push({ r: s.round, p: pl ? pl.id : -1, t: (pl ? pl.name + ' ' : '') + text });
    if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
  }

  // Spieler beginnt seinen Zug: Ränge prüfen
  function beginTurn(s, pl) {
    const msgs = [];
    while (pl.rank < RANKS.length - 1 && rankCheck(s, pl, pl.rank + 1).every(x => x.ok)) {
      pl.rank++;
      pl.ansehen = clamp(pl.ansehen + 3, 0, 100);
      log(s, pl, `wird zum ${RANKS[pl.rank].name} ernannt!`);
      msgs.push(`Du wirst zum ${RANKS[pl.rank].name} ernannt!`);
      if (pl.rank === RANKS.length - 1 && !s.over) {
        s.over = true; s.winner = pl.id;
        log(s, pl, 'ist Reichsfürst und gewinnt das Spiel!');
      }
    }
    return msgs;
  }

  // Zug beenden; liefert true, wenn eine neue Runde begann
  // die Reihenfolge rotiert jede Runde, damit niemand dauerhaft die besten Preise abgreift
  function endTurn(s) {
    const n = s.players.length;
    s.step++;
    let fresh = false;
    if (s.step >= n) { s.step = 0; newRound(s); fresh = true; }
    s.cur = (s.round + s.step) % n;
    return fresh;
  }

  function newRound(s) {
    s.round++;
    const se = season(s);
    // Märkte: Erzeugung, Verbrauch, Ausgleich
    CITIES.forEach(c => {
      GOODS.forEach(g => {
        const m = s.cities[c.id][g.id];
        if (m.mod < 1) m.stock += m.target * 0.3;
        m.stock -= m.target * (m.mod > 1 ? 0.3 : 0.06);
        m.stock += (m.target - m.stock) * 0.12;
        if (se === 3 && c.frozen) m.stock -= m.target * 0.05;
        m.stock = clamp(m.stock, 0, m.target * 3);
      });
    });
    if (se === 0) {
      s.weather = 0.55 + rng(s) * 0.85;
      log(s, null, `${seasonName(s)} ${year(s)}: ` + (s.weather > 1.15 ? 'Ein mildes Jahr kündigt sich an – die Bauern hoffen auf reiche Ernte.'
        : s.weather < 0.8 ? 'Kälte und Regen – die Saat steht schlecht.' : 'Das Jahr beginnt gewöhnlich.'));
    }
    s.players.forEach(pl => {
      pl.events = [];
      // Schiffe
      pl.ships.slice().forEach(sh => {
        if (sh.at) return;
        if (isFrozen(s, sh.to)) { pl.events.push(`Die „${sh.name}“ wartet vor dem vereisten ${C[sh.to].name}.`); return; }
        const stormP = se === 3 ? 0.14 : 0.06;
        if (rng(s) < stormP) {
          if (rng(s) < SHIPS[sh.type].sink) {
            pl.ships = pl.ships.filter(x => x !== sh);
            pl.events.push(`Die „${sh.name}“ ist im Sturm gesunken – mit Mann und Ladung.`);
            log(s, pl, `verliert die „${sh.name}“ im Sturm.`);
            return;
          }
          const lost = 0.2 + rng(s) * 0.25;
          GOODS.forEach(g => { sh.cargo[g.id] = Math.floor(sh.cargo[g.id] * (1 - lost)); });
          pl.events.push(`Sturm! Die „${sh.name}“ musste ${Math.round(lost * 100)} % der Ladung über Bord werfen.`);
        }
        sh.left--;
        if (sh.left <= 0) {
          sh.at = sh.to; sh.to = null;
          const value = GOODS.reduce((a, g) => a + sh.cargo[g.id] * g.base, 0);
          if (value > 300 && rng(s) < (sh.armed ? 0.04 : 0.12)) {
            const lost = 0.5 + rng(s) * 0.5;
            GOODS.forEach(g => { sh.cargo[g.id] = Math.floor(sh.cargo[g.id] * (1 - lost)); });
            pl.events.push(`Seeräuber haben die „${sh.name}“ vor ${C[sh.at].name} geentert und ${Math.round(lost * 100)} % der Ladung geraubt.`);
            log(s, pl, `wurde von Seeräubern überfallen.`);
          } else if (value > 300 && sh.armed && rng(s) < 0.08) {
            pl.events.push(`Die bewaffnete „${sh.name}“ hat einen Seeräuberangriff abgewehrt.`);
          }
          pl.events.push(`Die „${sh.name}“ ist in ${C[sh.at].name} eingelaufen.`);
        }
      });
      // Einnahmen und Kosten
      const taxIn = Math.round(pl.pop * pl.tax / 100 * 1.6 * (pl.buildings.markt ? 1.3 : 1));
      let cost = pl.ships.reduce((a, sh) => a + SHIPS[sh.type].upkeep, 0) + pl.soldiers * SOLDIER_UPKEEP
        + (Object.keys(pl.kontore).length - 1) * KONTOR_UPKEEP;
      pl.gold += taxIn - cost;
      pl.lastIncome = { tax: taxIn, cost };
      if (pl.gold < 0) {
        const interest = Math.ceil(-pl.gold * 0.08);
        pl.gold -= interest;
        pl.ansehen = clamp(pl.ansehen - 2, 0, 100);
        pl.events.push(`Du bist verschuldet: ${fmt(interest)} Gold Zinsen an die Wechsler.`);
      }
      // Zufallsereignis
      if (rng(s) < 0.22) randomEvent(s, pl);
      // Ernte im Herbst
      if (se === 2) {
        const farmed = Math.min(pl.land, pl.pop * 3);
        let h = Math.round(farmed * YIELD * s.weather * (pl.buildings.muehle ? 1.3 : 1));
        const home = pl.kontore[pl.home];
        const room = capOf(pl, home) - load(home);
        const stored = Math.min(h, room);
        home.getreide += stored;
        pl.harvest = h;
        pl.annualDue = true;
        pl.events.push(`Ernte: ${fmt(h)} Last Getreide` + (stored < h ? ` (nur ${fmt(stored)} passten ins Lager)` : '') + '.');
      }
      pl.stats.push({ r: s.round, w: worth(s, pl) });
    });
    if (s.round >= s.years * 4 && !s.over) {
      s.over = true;
      const best = s.players.slice().sort((a, b) => score(s, b) - score(s, a))[0];
      s.winner = best.id;
      log(s, null, `Nach ${s.years} Jahren endet das Spiel. ${best.name} hat das größte Ansehen im Reich.`);
    }
  }
  const score = (s, pl) => pl.rank * 100000 + worth(s, pl);

  function randomEvent(s, pl) {
    const home = pl.kontore[pl.home];
    const list = [
      () => {
        const loss = Math.round(pl.pop * (0.08 + rng(s) * 0.1));
        pl.pop -= loss;
        return `Die Seuche geht um: ${fmt(loss)} deiner Untertanen sterben.`;
      },
      () => {
        if (pl.buildings.mauer || pl.soldiers >= 15) return `Räuber lagerten vor deinen Toren, zogen aber angesichts deiner Wachen weiter.`;
        const g = Math.round(Math.max(0, pl.gold) * (0.05 + rng(s) * 0.08)) + 50;
        pl.gold -= g;
        return `Raubritter plündern deine Dörfer: ${fmt(g)} Gold Schaden.`;
      },
      () => {
        const g = Math.round(200 + rng(s) * 800);
        pl.gold += g;
        return `Ein entfernter Vetter vermacht dir ${fmt(g)} Gold.`;
      },
      () => {
        const g = 150 + pl.rank * 150;
        pl.gold -= g;
        pl.ansehen = clamp(pl.ansehen + 4, 0, 100);
        return `Ein Fürst kehrt bei dir ein. Das Festmahl kostet ${fmt(g)} Gold, bringt aber Ansehen.`;
      },
      () => {
        const g = pick(s, ['bier', 'holz', 'tuch', 'salz']);
        const lost = Math.floor(home[g] * 0.5);
        if (lost <= 0) return `Ein Feuer im Hafenviertel – dein Lager blieb verschont.`;
        home[g] -= lost;
        return `Feuer im Lager! ${lost} Last ${G[g].name} verbrannt.`;
      },
      () => {
        const n = Math.round(pl.pop * 0.06) + 5;
        pl.pop += n;
        return `${fmt(n)} Siedler ziehen in dein Lehen.`;
      },
      () => {
        pl.ansehen = clamp(pl.ansehen + 3, 0, 100);
        return `Ein Spielmann besingt deine Großzügigkeit auf den Märkten. Ansehen +3.`;
      },
    ];
    const msg = pick(s, list)();
    pl.events.push(msg);
    log(s, pl, '– ' + msg.charAt(0).toLowerCase() + msg.slice(1));
  }

  // ---------- Computergegner ----------
  function aiTurn(s, pl) {
    beginTurn(s, pl);
    const home = { kind: 'kontor', city: pl.home };
    // Heimatlager: überschüssiges Getreide verkaufen (Vorrat für 1,2 Jahre behalten)
    const keep = Math.ceil(pl.pop * GRAIN_PER_HEAD * 1.2);
    if (pl.kontore[pl.home].getreide > keep + 5) sell(s, pl, home, 'getreide', pl.kontore[pl.home].getreide - keep);
    // Jahresabschluss
    if (pl.annualDue) {
      if (pl.kontore[pl.home].getreide < pl.pop * GRAIN_PER_HEAD) buy(s, pl, home, 'getreide', Math.ceil(pl.pop * GRAIN_PER_HEAD - pl.kontore[pl.home].getreide));
      setTax(pl, pl.ansehen < 25 ? 15 : 22);
      annual(s, pl, suggestedRation(pl));
    }
    // Schiffe
    pl.ships.forEach(sh => {
      if (!sh.at) return;
      const h = { kind: 'ship', id: sh.id };
      // Ladung verkaufen, wenn der Preis gut ist (oder im Zielhafen)
      GOODS.forEach(g => {
        if (sh.cargo[g.id] > 0 && (sellPrice(s, sh.at, g.id) >= g.base * 0.95 || sh.plan === sh.at)) sell(s, pl, h, g.id, sh.cargo[g.id]);
      });
      if (load(sh.cargo) > 0) {   // Rest: zum besten Abnehmer
        const g = GOODS.find(x => sh.cargo[x.id] > 0).id;
        const best = CITIES.filter(c => c.id !== sh.at && !isFrozen(s, c.id)).sort((a, b) => sellPrice(s, b.id, g) - sellPrice(s, a.id, g))[0];
        if (best && !isFrozen(s, sh.at)) { sh.plan = best.id; sail(s, pl, sh.id, best.id); }
        return;
      }
      if (isFrozen(s, sh.at)) return;
      const budget = Math.max(0, pl.gold - 300);
      let bestPlan = null;
      GOODS.forEach(g => {
        CITIES.forEach(c => {
          if (c.id === sh.at || isFrozen(s, c.id)) return;
          const q = Math.min(SHIPS[sh.type].cap, Math.floor(budget / Math.max(1, buyPrice(s, sh.at, g.id))));
          if (q <= 0) return;
          const b = quote(s, sh.at, g.id, q, false);
          if (b.n <= 0) return;
          const se = quote(s, c.id, g.id, b.n, true);
          const t = travelTime(sh, sh.at, c.id);
          const profit = (se.sum * 0.9 - b.sum) / t;
          if (profit > 40 && (!bestPlan || profit > bestPlan.profit)) bestPlan = { g: g.id, to: c.id, q: b.n, profit };
        });
      });
      if (bestPlan) {
        buy(s, pl, h, bestPlan.g, bestPlan.q);
        sh.plan = bestPlan.to;
        sail(s, pl, sh.id, bestPlan.to);
      } else if (sh.at !== pl.home && !isFrozen(s, pl.home)) {
        sh.plan = pl.home; sail(s, pl, sh.id, pl.home);
      }
    });
    // Investieren
    const reserve = 800 + pl.ships.length * 300;
    if (pl.gold > reserve + 400 && pl.ansehen < 40) donate(s, pl, 300);
    if (pl.gold > reserve + 2000 && pl.land < 60 + pl.rank * 60) buyLand(s, pl, Math.min(80, Math.floor((pl.gold - reserve - 2000) / LAND_PRICE)));
    const order = ['muehle', 'markt', 'kirche', 'speicher', 'mauer', 'dom'];
    for (const b of order) {
      if (pl.buildings[b]) continue;
      if (b === 'dom' && pl.rank < 5) break;
      if (pl.gold > B[b].price + reserve + 1000) build(s, pl, b);
      break;
    }
    if (pl.ships.length < 2 + Math.floor(pl.rank / 2) && pl.gold > SHIPS.holk.price + reserve + 2500) buyShip(s, pl, 'holk');
    else if (pl.ships.length < 2 && pl.gold > SHIPS.kogge.price + reserve + 1000) buyShip(s, pl, 'kogge');
    const wantSoldiers = pl.rank >= 5 ? 45 : pl.rank >= 3 ? 15 : 0;
    if (pl.soldiers < wantSoldiers && pl.gold > reserve + 1500) hire(s, pl, Math.min(wantSoldiers - pl.soldiers, 10));
    pl.ships.filter(sh => sh.at && !sh.armed && pl.gold > reserve + 2000).forEach(sh => arm(s, pl, sh.id));
  }

  const API = {
    SEASONS, GOODS, G, CITIES, C, SHIPS, BUILDINGS, B, RANKS, START_YEAR, HOME_CAP, KONTOR_CAP, KONTOR_PRICE,
    KONTOR_UPKEEP, SOLDIER_PRICE, SOLDIER_UPKEEP, LAND_PRICE, ARM_PRICE, GRAIN_PER_HEAD,
    newGame, season, year, seasonName, isFrozen, load, capOf, price, buyPrice, sellPrice, quote, worth, rankCheck,
    fmt, buy, sell, transfer, sail, travelTime, buyShip, sellShip, arm, buyKontor, buyLand, build, hire, donate,
    setTax, feud, annual, suggestedRation, beginTurn, endTurn, aiTurn, score, dist, holderGoods, holderObj,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SK = API;
})(typeof window !== 'undefined' ? window : globalThis);
