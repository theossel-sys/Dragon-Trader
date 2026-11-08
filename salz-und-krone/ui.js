/* Salz & Krone – Oberfläche */
(function () {
  'use strict';
  const SK = window.SK;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const $toast = document.getElementById('toast');
  const SAVE_KEY = 'salz-und-krone-v1';
  const fmt = SK.fmt;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let S = null;                 // Spielstand
  const ui = { tab: 'karte', city: null, holder: null, send: null, shown: -1 };

  // ---------- Speichern ----------
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* privat */ } }
  function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ } }

  // ---------- kleine Helfer ----------
  const me = () => S.players[S.cur];
  function toast(t) {
    $toast.textContent = t; $toast.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { $toast.hidden = true; }, 2600);
  }
  function modal(html, onClick) {
    $modal.innerHTML = `<div class="sheet">${html}</div>`;
    $modal.hidden = false;
    $modal.onclick = e => {
      const b = e.target.closest('[data-m]');
      if (b) onClick(b.dataset.m, b);
    };
  }
  function closeModal() { $modal.hidden = true; $modal.innerHTML = ''; $modal.onclick = null; }
  const seal = (pl, size) => `<div class="seal" style="background:${pl.color};${size ? `width:${size}px;height:${size}px` : ''}">${esc(pl.name.charAt(0).toUpperCase())}</div>`;
  const goodChip = (g, n) => `<span class="chip">${SK.G[g].icon} ${n}</span>`;
  const cargoChips = goods => {
    const c = SK.GOODS.filter(g => goods[g.id] > 0).map(g => goodChip(g.id, goods[g.id]));
    return c.length ? c.join('') : '<span class="muted small">leer</span>';
  };
  const shipSvg = (color, w) => `<svg viewBox="0 0 40 40" width="${w || 40}" height="${w || 40}" aria-hidden="true">
      <path d="M20 4 L20 26" stroke="#4a3220" stroke-width="2"/>
      <path d="M21 6 Q33 14 21 24 Z" fill="#fbf1d8" stroke="#8a6a3a" stroke-width="1"/>
      <rect x="20" y="9" width="7" height="4" fill="${color}"/>
      <path d="M5 26 L35 26 L30 34 L10 34 Z" fill="#6b4523" stroke="#3b2412" stroke-width="1.2"/>
    </svg>`;
  function holderLabel(pl, h) {
    if (h.kind === 'ship') { const sh = pl.ships.find(x => x.id === h.id); return `${SK.SHIPS[sh.type].name} „${esc(sh.name)}“`; }
    return h.city === pl.home ? 'Heimatlager' : 'Kontor';
  }
  const presentIn = (pl, city) => !!pl.kontore[city] || pl.ships.some(sh => sh.at === city);

  // ---------- Titelbild / Neues Spiel ----------
  const setup = {
    years: 15,
    players: [
      { name: 'Hinrich', ai: false, home: 'luebeck' },
      { name: 'Margarete', ai: true, home: 'bruegge' },
      { name: 'Wulf', ai: true, home: 'danzig' },
      { name: '', ai: true, home: '', off: true },
    ],
  };
  function title() {
    const saved = loadSave();
    const rows = setup.players.map((p, i) => `
      <div class="pl-row">
        <div class="seal" style="background:${['#b3261e', '#1f5fa8', '#2e7d32', '#8e44ad'][i]};${p.off ? 'opacity:.3' : ''}">${i + 1}</div>
        <input type="text" data-name="${i}" value="${esc(p.name)}" placeholder="${p.off ? 'frei' : 'Name'}" maxlength="16" ${p.off ? 'disabled' : ''}>
        <select data-kind="${i}">
          <option value="h" ${!p.off && !p.ai ? 'selected' : ''}>Mensch</option>
          <option value="k" ${!p.off && p.ai ? 'selected' : ''}>Computer</option>
          ${i > 0 ? `<option value="x" ${p.off ? 'selected' : ''}>– frei –</option>` : ''}
        </select>
      </div>`).join('');
    $app.innerHTML = `
      <div class="title">
        <h1>Salz &amp; Krone</h1>
        <div class="sub">Handle mit Salz und Hering zwischen Brügge und Reval, kaufe Land, baue dein Lehen aus – und steige vom Krämer zum Reichsfürsten auf.</div>
        ${saved && !saved.over ? `<button class="btn primary" data-t="cont">Spiel fortsetzen – ${SK.SEASONS[saved.round % 4]} ${SK.START_YEAR + Math.floor(saved.round / 4)}</button>` : ''}
        <div class="sheet">
          <h2>Neues Spiel</h2>
          ${rows}
          <h3>Spieldauer</h3>
          <div class="seg">${[10, 15, 25].map(y => `<button data-years="${y}" class="${setup.years === y ? 'on' : ''}">${y} Jahre</button>`).join('')}</div>
          <p class="muted small">Gewonnen hat, wer zuerst Reichsfürst wird – oder am Ende den höchsten Rang und das größte Vermögen hat. Mehrere Menschen spielen abwechselnd am selben Gerät.</p>
          <div class="actions" style="display:flex;justify-content:flex-end"><button class="btn primary" data-t="start">Spiel beginnen</button></div>
        </div>
      </div>`;
    $app.querySelectorAll('[data-name]').forEach(el => { el.oninput = () => { setup.players[+el.dataset.name].name = el.value; }; });
    $app.querySelectorAll('[data-kind]').forEach(el => {
      el.onchange = () => {
        const p = setup.players[+el.dataset.kind];
        p.off = el.value === 'x'; p.ai = el.value === 'k';
        if (!p.off && !p.name) p.name = ['Hinrich', 'Margarete', 'Wulf', 'Gesche'][+el.dataset.kind];
        title();
      };
    });
    $app.onclick = e => {
      const y = e.target.closest('[data-years]');
      if (y) { setup.years = +y.dataset.years; title(); return; }
      const t = e.target.closest('[data-t]');
      if (!t) return;
      if (t.dataset.t === 'cont') { S = saved; ui.shown = -1; startTurn(); }
      if (t.dataset.t === 'start') {
        const players = setup.players.filter(p => !p.off).map(p => ({ name: p.name.trim() || 'Namenlos', ai: p.ai, home: p.home }));
        if (!players.some(p => !p.ai)) { toast('Mindestens ein Mensch muss mitspielen.'); return; }
        S = SK.newGame({ players, years: setup.years });
        ui.shown = -1;
        startTurn();
      }
    };
  }

  // ---------- Zugablauf ----------
  function humans() { return S.players.filter(p => !p.ai).length; }

  function startTurn() {
    $app.onclick = null;
    // Computergegner ziehen sofort
    let guard = 0;
    while (!S.over && me().ai && guard++ < 50) {
      SK.aiTurn(S, me());
      SK.endTurn(S);
    }
    save();
    if (S.over) { gameOver(); return; }
    const pl = me();
    ui.tab = 'karte'; ui.city = pl.home; ui.holder = null; ui.send = null;
    const key = S.round * 10 + S.cur;
    const go = () => {
      ui.shown = key;
      const msgs = SK.beginTurn(S, pl);
      if (S.over) { save(); gameOver(); return; }
      render();
      news(pl, msgs);
    };
    if (humans() > 1 && ui.shown !== key) {
      $app.innerHTML = `<div class="title">${seal(pl, 72)}<h1 style="font-size:34px">${esc(pl.name)}</h1>
        <div class="sub">${SK.seasonName(S)} ${SK.year(S)} – ${SK.RANKS[pl.rank].name} aus ${SK.C[pl.home].name}</div>
        <button class="btn primary" id="go">Ich bin bereit</button></div>`;
      document.getElementById('go').onclick = go;
    } else if (ui.shown !== key) go();
    else render();
  }

  function news(pl, msgs) {
    const ev = (pl.events || []);
    const otherLog = S.log.filter(l => l.r === S.round && l.p !== pl.id && l.p >= 0).slice(-6);
    const items = msgs.map(m => `<p><b>👑 ${esc(m)}</b></p>`).concat(ev.map(m => `<p>${esc(m)}</p>`));
    const inc = pl.lastIncome ? `<p class="muted small">Steuern +${fmt(pl.lastIncome.tax)} · Unterhalt −${fmt(pl.lastIncome.cost)} Gold</p>` : '';
    const others = otherLog.length ? `<h3>Aus dem Reich</h3>${otherLog.map(l => `<p class="small">${esc(l.t)}</p>`).join('')}` : '';
    const after = () => { closeModal(); if (pl.annualDue) annualDialog(pl); };
    if (!items.length && !others && !pl.annualDue) return;
    if (!items.length && !others) { after(); return; }
    modal(`<h2>${SK.seasonName(S)} ${SK.year(S)}</h2>${items.join('')}${inc}${others}
      <div class="actions"><button class="btn primary" data-m="ok">Weiter</button></div>`, after);
  }

  function annualDialog(pl) {
    const home = pl.kontore[pl.home];
    const need = Math.ceil(pl.pop * SK.GRAIN_PER_HEAD);
    let ration = Math.min(home.getreide, need), tax = pl.tax;
    const draw = () => {
      const r = ration / Math.max(1, need);
      const mood = r >= 1.15 ? 'Das Volk jubelt – Zuzug wahrscheinlich.' : r >= 1 ? 'Alle werden satt.' : r >= 0.8 ? 'Knapp – einige murren.' : 'Hunger! Menschen sterben oder fliehen.';
      modal(`<h2>Jahresabschluss ${SK.year(S)}</h2>
        <div class="stat"><span>Ernte dieses Jahr</span><b>${fmt(pl.harvest)} Last</b></div>
        <div class="stat"><span>Getreide im Heimatlager</span><b>${fmt(home.getreide)} Last</b></div>
        <div class="stat"><span>Untertanen</span><b>${fmt(pl.pop)}</b></div>
        <div class="stat"><span>Bedarf fürs Jahr</span><b>${fmt(need)} Last</b></div>
        <h3>Getreide ans Volk verteilen: ${fmt(ration)} Last (${Math.round(r * 100)} %)</h3>
        <input type="range" min="0" max="${home.getreide}" value="${ration}" data-r="ration">
        <p class="small ${r < 0.8 ? 'dear' : r >= 1 ? 'cheap' : ''}">${mood}</p>
        ${home.getreide < need ? `<p class="small muted">Zu wenig Getreide? Kaufe im Heimatlager (Markt) welches dazu, bevor du bestätigst.</p>` : ''}
        <h3>Steuersatz: ${tax} %</h3>
        <input type="range" min="0" max="50" value="${tax}" data-r="tax">
        <p class="small muted">${tax > 30 ? 'Hohe Steuern kosten Ansehen und vertreiben Leute.' : tax <= 15 ? 'Milde Steuern ziehen Siedler an.' : 'Ein üblicher Satz.'}</p>
        <div class="actions"><button class="btn" data-m="markt">Erst zum Markt</button><button class="btn primary" data-m="ok">Bestätigen</button></div>`,
      act => {
        if (act === 'markt') { closeModal(); ui.tab = 'markt'; ui.city = pl.home; ui.holder = { kind: 'kontor', city: pl.home }; render(); toast('Danach im Lehen „Jahresabschluss“ antippen.'); return; }
        if (act === 'ok') {
          SK.setTax(pl, tax);
          const res = SK.annual(S, pl, ration);
          closeModal(); save(); render();
          toast(res.diff >= 0 ? `Dein Volk wächst um ${fmt(res.diff)} auf ${fmt(res.pop)}.` : `Dein Volk schrumpft um ${fmt(-res.diff)} auf ${fmt(res.pop)}.`);
        }
      });
      $modal.querySelectorAll('[data-r]').forEach(el => {
        el.oninput = () => {
          if (el.dataset.r === 'ration') ration = +el.value; else tax = +el.value;
          const keep = el.dataset.r; draw();
          const again = $modal.querySelector(`[data-r="${keep}"]`); if (again) again.focus();
        };
      });
    };
    draw();
  }

  function endTurn() {
    const pl = me();
    if (pl.annualDue) { annualDialog(pl); toast('Erst den Jahresabschluss erledigen.'); return; }
    const moving = pl.ships.filter(sh => sh.at && !SK.isFrozen(S, sh.at)).length;
    const doEnd = () => { closeModal(); SK.endTurn(S); save(); startTurn(); };
    if (moving && pl.ships.every(sh => sh.at)) {
      modal(`<h2>Zug beenden?</h2><p>Alle deine Schiffe liegen noch im Hafen. Wirklich weiter?</p>
        <div class="actions"><button class="btn" data-m="no">Zurück</button><button class="btn primary" data-m="yes">Zug beenden</button></div>`,
      a => { if (a === 'yes') doEnd(); else closeModal(); });
    } else doEnd();
  }

  function gameOver() {
    const ranked = S.players.slice().sort((a, b) => SK.score(S, b) - SK.score(S, a));
    clearSave();
    $app.onclick = null;
    $app.innerHTML = `<div class="title"><h1 style="font-size:40px">${esc(S.players[S.winner].name)} siegt!</h1>
      <div class="sub">${S.players[S.winner].rank === SK.RANKS.length - 1 ? 'Zum Reichsfürsten erhoben.' : `Nach ${S.years} Jahren das größte Haus im Reich.`}</div>
      <div class="sheet"><table><tr><th>#</th><th>Name</th><th>Rang</th><th class="num">Vermögen</th></tr>
      ${ranked.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}</td><td>${SK.RANKS[p.rank].name}</td><td class="num">${fmt(SK.worth(S, p))}</td></tr>`).join('')}
      </table></div><button class="btn primary" id="again">Neues Spiel</button></div>`;
    document.getElementById('again').onclick = title;
  }

  // ---------- Hauptansicht ----------
  const TABS = [['karte', '🗺️', 'Karte'], ['flotte', '⛵', 'Flotte'], ['markt', '⚖️', 'Markt'], ['lehen', '🏰', 'Lehen'], ['reich', '👑', 'Reich']];
  function render() {
    const pl = me();
    const body = { karte: viewMap, flotte: viewFleet, markt: viewMarket, lehen: viewFief, reich: viewRealm }[ui.tab](pl);
    $app.innerHTML = `
      <header class="top">${seal(pl)}
        <div class="who"><b>${esc(pl.name)}</b><small>${SK.RANKS[pl.rank].name} · ${SK.seasonName(S)} ${SK.year(S)}</small></div>
        <div class="gold">${fmt(pl.gold)} 🪙<small>Ansehen ${pl.ansehen}</small></div>
        <button class="endturn" data-a="end">Zug ▸</button>
      </header>
      <main>${body}</main>
      <nav class="tabs">${TABS.map(t => `<button data-tab="${t[0]}" class="${ui.tab === t[0] ? 'on' : ''}"><span>${t[1]}</span>${t[2]}</button>`).join('')}</nav>`;
    $app.onclick = onClick;
    $app.querySelectorAll('[data-range]').forEach(el => { el.onchange = () => onRange(el); });
  }

  // ---------- Karte ----------
  const LAND = [
    // Skandinavien
    'M60,0 L720,0 L700,60 L650,110 L612,170 L600,228 L566,262 L520,300 L470,328 L428,300 L392,252 L330,222 L262,206 L200,194 L150,166 L112,128 L84,70 Z',
    // Finnland
    'M760,0 L1000,0 L1000,176 L920,170 L850,150 L790,110 L770,60 Z',
    // Festland mit Jütland und Baltikum
    'M0,640 L0,582 L90,556 L180,526 L262,502 L330,482 L346,420 L340,352 L360,312 L396,306 L410,350 L416,410 L452,440 L520,446 L600,436 L662,416 L720,380 L758,330 L776,280 L800,232 L860,206 L1000,200 L1000,640 Z',
    // Gotland, Öland, Seeland, Bornholm
    'M606,280 L638,268 L652,318 L628,352 L604,322 Z',
    'M556,330 L566,328 L572,372 L560,392 L552,360 Z',
    'M432,372 L460,364 L470,396 L446,410 L428,396 Z',
    'M520,398 L534,394 L538,408 L524,412 Z',
  ];
  function viewMap(pl) {
    const sel = ui.city && SK.C[ui.city];
    let svg = `<svg class="map" viewBox="0 0 1000 640" role="img" aria-label="Seekarte">
      <defs>
        <radialGradient id="sea" cx="45%" cy="45%" r="75%"><stop offset="0" stop-color="#8fb7c6"/><stop offset="1" stop-color="#4f7f96"/></radialGradient>
        <linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe0b9"/><stop offset="1" stop-color="#d9c08a"/></linearGradient>
        <filter id="sh" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2b3d46" flood-opacity=".45"/></filter>
        <pattern id="waves" width="40" height="18" patternUnits="userSpaceOnUse"><path d="M0 9 Q10 3 20 9 T40 9" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="1.4"/></pattern>
      </defs>
      <rect width="1000" height="640" fill="url(#sea)"/><rect width="1000" height="640" fill="url(#waves)"/>
      ${SK.season(S) === 3 ? '<path d="M560,0 L1000,0 L1000,330 L880,320 L780,240 L640,180 L600,120 Z" fill="#ffffff" fill-opacity=".38"/>' : ''}
      <g filter="url(#sh)">${LAND.map(d => `<path d="${d}" fill="url(#land)" stroke="#8a6a3a" stroke-width="1.5"/>`).join('')}</g>
      <g fill="#7c6a45" opacity=".55" font-size="15" font-style="italic">
        <text x="150" y="380">Nordsee</text><text x="660" y="380">Ostsee</text><text x="380" y="80" font-size="22">Norwegen · Schweden</text>
      </g>
      <g transform="translate(920,560)" opacity=".75"><circle r="32" fill="#f3e6c8" stroke="#8a6a3a"/><path d="M0,-28 L6,0 L0,28 L-6,0 Z" fill="#9e2a1f"/><path d="M-28,0 L0,-6 L28,0 L0,6 Z" fill="#5b4630"/><text y="-34" text-anchor="middle" font-size="13" fill="#5b4630">N</text></g>`;
    // Reiseroute des gewählten Schiffs
    if (ui.send) {
      const sh = pl.ships.find(x => x.id === ui.send);
      if (sh && sh.at) SK.CITIES.forEach(c => {
        if (c.id === sh.at) return;
        const frozen = SK.isFrozen(S, c.id) || SK.isFrozen(S, sh.at);
        svg += `<line x1="${SK.C[sh.at].x}" y1="${SK.C[sh.at].y}" x2="${c.x}" y2="${c.y}" stroke="${frozen ? '#9aa' : '#2a1d12'}" stroke-opacity=".35" stroke-dasharray="6 6" stroke-width="2"/>`;
      });
    }
    // Schiffe auf See
    S.players.forEach(p => p.ships.forEach(sh => {
      if (sh.at) return;
      const a = SK.C[sh.from || p.home], b = SK.C[sh.to], total = SK.travelTime(sh, a.id, b.id);
      const f = Math.min(0.85, Math.max(0.15, 1 - sh.left / (total + 0.5)));
      const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
      if (p === pl) svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${p.color}" stroke-opacity=".55" stroke-dasharray="3 7" stroke-width="2.5"/>`;
      svg += `<g transform="translate(${x - 14},${y - 18})" opacity="${p === pl ? 1 : .7}">${shipSvg(p.color, 28)}</g>`;
    }));
    // Städte
    SK.CITIES.forEach(c => {
      const homeOf = S.players.find(p => p.home === c.id);
      const mine = pl.ships.filter(sh => sh.at === c.id).length;
      const isSel = ui.city === c.id;
      const frozen = SK.isFrozen(S, c.id);
      svg += `<g class="city" data-city="${c.id}" transform="translate(${c.x},${c.y})">
        <circle r="34" fill="transparent"/>
        ${isSel ? '<circle r="22" fill="none" stroke="#f1c75b" stroke-width="4"/>' : ''}
        ${homeOf ? `<path d="M-2,-30 L-2,-8 M-2,-30 L14,-25 L-2,-20" stroke="#3b2412" stroke-width="2" fill="${homeOf.color}"/>` : ''}
        <circle r="11" fill="${frozen ? '#dfeef5' : '#f8eed6'}" stroke="#3b2412" stroke-width="2.5"/>
        <rect x="-5" y="-5" width="10" height="10" fill="${pl.kontore[c.id] ? pl.color : '#8a6a3a'}" transform="rotate(45)"/>
        <text y="28" text-anchor="middle" font-size="19" fill="#2b1d10" stroke="#f3e6c8" stroke-width="4" paint-order="stroke">${c.name}${frozen ? ' ❄' : ''}</text>
        ${mine ? `<g transform="translate(10,-34)">${shipSvg(pl.color, 26)}${mine > 1 ? `<text x="24" y="10" font-size="14" fill="#2b1d10">${mine}</text>` : ''}</g>` : ''}
      </g>`;
    });
    svg += '</svg>';

    let panel = '';
    if (ui.send) {
      const sh = pl.ships.find(x => x.id === ui.send);
      panel = `<div class="banner"><span>Wähle das Ziel für die „${esc(sh.name)}“</span><button class="btn sm" data-a="cancelsend">Abbrechen</button></div>`;
    }
    if (sel) {
      const prices = SK.GOODS.map(g => {
        const p = SK.sellPrice(S, sel.id, g.id), rel = p / g.base;
        return `<span class="chip ${rel < 0.8 ? 'ok' : rel > 1.25 ? 'no' : ''}" title="${g.name}">${g.icon} ${p}</span>`;
      }).join(' ');
      const ships = pl.ships.filter(sh => sh.at === sel.id);
      const owner = S.players.find(p => p.home === sel.id);
      panel += `<div class="sheet"><div class="spread"><h2>${sel.name}${SK.isFrozen(S, sel.id) ? ' – zugefroren' : ''}</h2>
          ${owner ? `<span class="chip">${owner === pl ? 'Deine Heimat' : 'Heimat von ' + esc(owner.name)}</span>` : ''}</div>
        <p class="small muted">Erzeugt: ${sel.p.map(g => SK.G[g].icon + ' ' + SK.G[g].name).join(', ')} · Gefragt: ${sel.d.map(g => SK.G[g].icon + ' ' + SK.G[g].name).join(', ')}</p>
        <div class="row small">${prices}</div>
        <p class="small muted">Verkaufspreise je Last – grün = günstig, rot = teuer.</p>
        <div class="row">
          ${presentIn(pl, sel.id) ? `<button class="btn primary" data-a="tomarket" data-city="${sel.id}">Zum Markt</button>` : ''}
          ${ships.map(sh => `<button class="btn" data-a="send" data-ship="${sh.id}">⛵ „${esc(sh.name)}“ segeln</button>`).join('')}
          ${ships.length && !pl.kontore[sel.id] ? `<button class="btn" data-a="kontor" data-city="${sel.id}">Kontor eröffnen (${fmt(SK.KONTOR_PRICE)})</button>` : ''}
        </div></div>`;
    }
    return `<div class="wide2"><div class="sheet mapwrap">${svg}</div><div>${panel}${legend(pl)}</div></div>`;
  }
  function legend(pl) {
    const sea = pl.ships.filter(sh => !sh.at);
    return `<div class="sheet small"><h3 style="margin-top:0">Deine Schiffe</h3>
      ${pl.ships.map(sh => `<div class="stat"><span>⛵ ${esc(sh.name)}</span><span class="muted">${sh.at ? 'in ' + SK.C[sh.at].name : `→ ${SK.C[sh.to].name}, noch ${sh.left} ${sh.left === 1 ? 'Jahreszeit' : 'Jahreszeiten'}`}</span></div>`).join('')}
      ${sea.length ? '' : '<p class="muted">Tippe auf eine Stadt, um Preise zu sehen oder ein Schiff loszuschicken.</p>'}</div>`;
  }

  // ---------- Flotte ----------
  function viewFleet(pl) {
    const cards = pl.ships.map(sh => {
      const T = SK.SHIPS[sh.type], used = SK.load(sh.cargo);
      const where = sh.at ? `liegt in ${SK.C[sh.at].name}` : `segelt nach ${SK.C[sh.to].name} · Ankunft in ${sh.left} ${sh.left === 1 ? 'Jahreszeit' : 'Jahreszeiten'}`;
      return `<div class="ship"><div class="pic">${shipSvg(pl.color, 46)}</div><div>
        <div class="spread"><b>„${esc(sh.name)}“</b><span class="chip">${T.name}${sh.armed ? ' · ⚔️' : ''}</span></div>
        <div class="small muted">${where}</div>
        <div class="cargo">${cargoChips(sh.cargo)}</div>
        <div class="small muted">${used} / ${T.cap} Last</div><div class="bar"><i style="width:${100 * used / T.cap}%"></i></div>
        ${sh.at ? `<div class="row" style="margin-top:8px">
          <button class="btn sm primary" data-a="tomarket" data-city="${sh.at}" data-ship="${sh.id}">Handeln</button>
          <button class="btn sm" data-a="send" data-ship="${sh.id}">Segeln</button>
          ${!sh.armed ? `<button class="btn sm" data-a="arm" data-ship="${sh.id}">Bewaffnen (${SK.ARM_PRICE})</button>` : ''}
          ${pl.ships.length > 1 && !used ? `<button class="btn sm" data-a="sellship" data-ship="${sh.id}">Verkaufen</button>` : ''}
        </div>` : ''}
      </div></div>`;
    }).join('');
    const shop = Object.keys(SK.SHIPS).map(k => {
      const T = SK.SHIPS[k];
      return `<div class="stat"><span><b>${T.name}</b> <span class="muted small">${T.cap} Last · ${k === 'schnigge' ? 'schnell' : k === 'holk' ? 'langsam, robust' : 'ausgewogen'} · Unterhalt ${T.upkeep}</span></span>
        <button class="btn sm" data-a="buyship" data-type="${k}" ${pl.gold < T.price ? 'disabled' : ''}>${fmt(T.price)} 🪙</button></div>`;
    }).join('');
    return `<div class="sheet"><h2>Deine Flotte</h2>${cards}</div>
      <div class="sheet"><h2>Werft in ${SK.C[pl.home].name}</h2>${shop}
        <p class="small muted">Neue Schiffe laufen in deiner Heimatstadt vom Stapel. Bewaffnete Schiffe schrecken Seeräuber ab.</p></div>`;
  }

  // ---------- Markt ----------
  function viewMarket(pl) {
    const cities = SK.CITIES.filter(c => presentIn(pl, c.id));
    if (!cities.length) return `<div class="sheet"><h2>Markt</h2><p>Du hast gerade weder ein Schiff noch ein Kontor in einem Hafen.</p></div>`;
    if (!ui.city || !presentIn(pl, ui.city)) ui.city = cities[0].id;
    const city = ui.city;
    const holders = [];
    if (pl.kontore[city]) holders.push({ kind: 'kontor', city });
    pl.ships.filter(sh => sh.at === city).forEach(sh => holders.push({ kind: 'ship', id: sh.id }));
    if (!ui.holder || !holders.some(h => JSON.stringify(h) === JSON.stringify(ui.holder))) ui.holder = holders[0];
    const h = ui.holder, goods = SK.holderGoods(pl, h), obj = SK.holderObj(pl, h);
    const cap = h.kind === 'ship' ? SK.SHIPS[obj.type].cap : SK.capOf(pl, obj);
    const used = SK.load(goods);
    const other = holders.find(x => JSON.stringify(x) !== JSON.stringify(h));
    const C = SK.C[city];
    const rows = SK.GOODS.map(g => {
      const bp = SK.buyPrice(S, city, g.id), sp = SK.sellPrice(S, city, g.id), rel = sp / g.base;
      const cls = rel < 0.8 ? 'cheap' : rel > 1.25 ? 'dear' : '';
      return `<div class="mrow">
        <div class="good"><span class="ic">${g.icon}</span>${g.name}${C.p.includes(g.id) ? ' <span class="chip ok">Erz.</span>' : ''}${C.d.includes(g.id) ? ' <span class="chip no">gefr.</span>' : ''}</div>
        <div class="num ${cls}">${bp}</div><div class="num ${cls}">${sp}</div><div class="num"><b>${goods[g.id] || '–'}</b></div>
        <div class="trade">
          <button class="btn sm" data-a="sell" data-g="${g.id}" data-q="10" ${goods[g.id] ? '' : 'disabled'}>−10</button>
          <button class="btn sm" data-a="sell" data-g="${g.id}" data-q="1" ${goods[g.id] ? '' : 'disabled'}>−1</button>
          <button class="btn sm" data-a="buy" data-g="${g.id}" data-q="1">+1</button>
          <button class="btn sm" data-a="buy" data-g="${g.id}" data-q="10">+10</button>
          ${other ? `<button class="btn sm" data-a="move" data-g="${g.id}" ${goods[g.id] ? '' : 'disabled'} title="umladen">⇄</button>` : ''}
        </div></div>`;
    }).join('');
    return `<div class="sheet">
        <div class="spread"><h2>Markt ${C.name}</h2>
          <select data-range="city">${cities.map(c => `<option value="${c.id}" ${c.id === city ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
        <div class="row" style="margin:6px 0 4px">${holders.map(x => `<button class="btn sm ${JSON.stringify(x) === JSON.stringify(h) ? 'primary' : ''}" data-a="holder" data-h='${JSON.stringify(x)}'>${holderLabel(pl, x)}</button>`).join('')}</div>
        <div class="small muted">${holderLabel(pl, h)}: ${used} / ${cap} Last belegt${other ? ' · ⇄ lädt 10 Last um nach: ' + holderLabel(pl, other) : ''}</div>
        <div class="bar"><i style="width:${100 * used / cap}%"></i></div>
        <div class="mrow head"><div>Ware</div><div class="num">Kauf</div><div class="num">Verk.</div><div class="num">Lager</div><div></div></div>${rows}
        <div class="row" style="margin-top:10px;justify-content:flex-end">
          <button class="btn" data-a="sellall" ${used ? '' : 'disabled'}>Alles verkaufen</button>
          ${h.kind === 'ship' && !SK.isFrozen(S, city) ? `<button class="btn primary" data-a="send" data-ship="${h.id}">Lossegeln ▸</button>` : ''}
        </div>
        <p class="small muted">Jeder Kauf treibt den Preis hoch, jeder Verkauf drückt ihn. „Erz.“ = hier erzeugt (billig), „gefr.“ = hier gefragt (teuer).</p>
      </div>`;
  }

  // ---------- Lehen ----------
  function viewFief(pl) {
    const home = pl.kontore[pl.home];
    const need = Math.ceil(pl.pop * SK.GRAIN_PER_HEAD);
    const farmed = Math.min(pl.land, pl.pop * 3);
    const blds = SK.BUILDINGS.map(b => `<div class="stat"><span>${b.icon} <b>${b.name}</b> <span class="small muted">${b.text}</span></span>
      ${pl.buildings[b.id] ? '<span class="chip ok">✓ gebaut</span>' : `<button class="btn sm" data-a="build" data-b="${b.id}" ${pl.gold < b.price ? 'disabled' : ''}>${fmt(b.price)} 🪙</button>`}</div>`).join('');
    const rivals = S.players.filter(p => p !== pl);
    return `<div class="grid2">
      <div class="sheet"><h2>Dein Lehen bei ${SK.C[pl.home].name}</h2>
        <div class="stat"><span>Land</span><b>${fmt(pl.land)} Morgen</b></div>
        <div class="stat"><span>Bestellt</span><b>${fmt(farmed)} Morgen ${farmed < pl.land ? '<span class="small muted">(zu wenig Leute)</span>' : ''}</b></div>
        <div class="stat"><span>Untertanen</span><b>${fmt(pl.pop)}</b></div>
        <div class="stat"><span>Getreide im Lager</span><b>${fmt(home.getreide)} / Bedarf ${fmt(need)} Last</b></div>
        <div class="stat"><span>Steuersatz</span><b>${pl.tax} %</b></div>
        <div class="stat"><span>Steuern je Jahreszeit</span><b>≈ ${fmt(pl.pop * pl.tax / 100 * 1.6 * (pl.buildings.markt ? 1.3 : 1))} 🪙</b></div>
        <div class="stat"><span>Soldaten</span><b>${pl.soldiers}</b></div>
        <div class="stat"><span>Ansehen</span><b>${pl.ansehen} / 100</b></div>
        ${pl.annualDue ? '<div class="row" style="margin-top:10px"><button class="btn primary" data-a="annual">Jahresabschluss</button></div>' : ''}
      </div>
      <div class="sheet"><h2>Land &amp; Leute</h2>
        <div class="stat"><span>Land kaufen <span class="small muted">(${SK.LAND_PRICE} 🪙 je Morgen)</span></span>
          <span class="row"><button class="btn sm" data-a="land" data-n="10">+10</button><button class="btn sm" data-a="land" data-n="50">+50</button></span></div>
        <div class="stat"><span>Soldaten <span class="small muted">(${SK.SOLDIER_PRICE} 🪙, Sold ${SK.SOLDIER_UPKEEP})</span></span>
          <span class="row"><button class="btn sm" data-a="hire" data-n="-5" ${pl.soldiers ? '' : 'disabled'}>−5</button><button class="btn sm" data-a="hire" data-n="5">+5</button><button class="btn sm" data-a="hire" data-n="20">+20</button></span></div>
        <div class="stat"><span>Spenden an Kirche und Arme</span>
          <span class="row"><button class="btn sm" data-a="donate" data-n="200">200</button><button class="btn sm" data-a="donate" data-n="1000">1000</button></span></div>
        <h3>Steuern (gelten ab sofort)</h3>
        <input type="range" min="0" max="50" value="${pl.tax}" data-range="tax">
        <p class="small muted">Jeder Bauer bestellt bis zu 3 Morgen; pro Kopf braucht das Volk ${SK.GRAIN_PER_HEAD} Last Getreide im Jahr. Die Ernte kommt im Herbst.</p>
      </div>
      <div class="sheet"><h2>Bauten</h2>${blds}</div>
      <div class="sheet"><h2>Fehde</h2>
        <p class="small muted">Mit mindestens 10 Soldaten kannst du einem Rivalen die Fehde erklären. Sieg: Land und Gold. Kostet immer Ansehen; Stadtmauern schützen.</p>
        ${rivals.map(r => `<div class="stat"><span>${esc(r.name)} <span class="small muted">${SK.RANKS[r.rank].name} · ${r.soldiers} Soldaten${r.buildings.mauer ? ' · Mauer' : ''}</span></span>
          <button class="btn sm danger" data-a="feud" data-p="${r.id}" ${pl.soldiers < 10 ? 'disabled' : ''}>Fehde</button></div>`).join('')}
      </div></div>`;
  }

  // ---------- Reich ----------
  function viewRealm(pl) {
    const ladder = SK.RANKS.map((R, i) => {
      const done = i <= pl.rank, next = i === pl.rank + 1;
      const req = i ? SK.rankCheck(S, pl, i).map(x => `<span class="chip ${x.ok ? 'ok' : 'no'}">${x.ok ? '✓' : '✗'} ${x.t}</span>`).join(' ') : '';
      return `<li class="${done ? 'done' : ''} ${next ? 'next' : ''}"><div class="n">${i + 1}</div><div><b>${R.name}</b>${i && !done ? `<div class="row small" style="margin-top:4px">${req}</div>` : ''}</div></li>`;
    }).join('');
    const ranked = S.players.slice().sort((a, b) => SK.score(S, b) - SK.score(S, a));
    const table = `<table><tr><th></th><th>Name</th><th>Rang</th><th class="num">Vermögen</th><th class="num">Land</th><th class="num">Volk</th></tr>
      ${ranked.map(p => `<tr><td>${seal(p, 26)}</td><td>${esc(p.name)}${p.ai ? ' <span class="small muted">(KI)</span>' : ''}</td><td>${SK.RANKS[p.rank].name}</td>
        <td class="num">${fmt(SK.worth(S, p))}</td><td class="num">${fmt(p.land)}</td><td class="num">${fmt(p.pop)}</td></tr>`).join('')}</table>`;
    const logs = S.log.slice(-60).reverse().map(l => `<p><span class="when">${SK.SEASONS[l.r % 4].slice(0, 3)}. ${SK.START_YEAR + Math.floor(l.r / 4)}</span>${esc(l.t)}</p>`).join('');
    const left = S.years * 4 - S.round;
    return `<div class="grid2">
      <div class="sheet"><h2>Dein Aufstieg</h2><p class="small muted">Vermögen: ${fmt(SK.worth(S, pl))} 🪙 (Gold, Waren, Schiffe, Land und Bauten)</p><ul class="ladder">${ladder}</ul></div>
      <div><div class="sheet"><h2>Die Häuser des Reiches</h2>${table}<p class="small muted">Noch ${Math.ceil(left / 4)} Jahre bis zum Spielende.</p></div>
      <div class="sheet"><h2>Chronik</h2><div class="log">${logs}</div></div>
      <div class="sheet"><div class="row"><button class="btn" data-a="menu">Hauptmenü</button><span class="small muted">Das Spiel wird automatisch gespeichert.</span></div></div></div></div>`;
  }

  // ---------- Eingaben ----------
  function err(e) { if (e && typeof e === 'string') toast(e); }
  function onRange(el) {
    const pl = me();
    if (el.dataset.range === 'tax') { SK.setTax(pl, +el.value); save(); render(); toast(`Steuersatz ${pl.tax} %`); }
    if (el.dataset.range === 'city') { ui.city = el.value; ui.holder = null; render(); }
  }
  function onClick(e) {
    const t = e.target.closest('[data-tab],[data-a],[data-city]');
    if (!t) return;
    const pl = me();
    if (t.dataset.tab) { ui.tab = t.dataset.tab; ui.send = ui.tab === 'karte' ? ui.send : null; render(); window.scrollTo(0, 0); return; }
    const a = t.dataset.a;
    if (!a && t.dataset.city) {             // Stadt auf der Karte
      const c = t.dataset.city;
      if (ui.send) { trySail(pl, ui.send, c); return; }
      ui.city = c; render(); return;
    }
    switch (a) {
      case 'end': endTurn(); return;
      case 'tomarket': ui.tab = 'markt'; ui.city = t.dataset.city; ui.holder = t.dataset.ship ? { kind: 'ship', id: t.dataset.ship } : null; break;
      case 'holder': ui.holder = JSON.parse(t.dataset.h); break;
      case 'buy': err(SK.buy(S, pl, ui.holder, t.dataset.g, +t.dataset.q)); break;
      case 'sell': err(SK.sell(S, pl, ui.holder, t.dataset.g, +t.dataset.q)); break;
      case 'sellall': SK.GOODS.forEach(g => { const n = SK.holderGoods(pl, ui.holder)[g.id]; if (n) SK.sell(S, pl, ui.holder, g.id, n); }); break;
      case 'move': {
        const city = ui.city, hs = [];
        if (pl.kontore[city]) hs.push({ kind: 'kontor', city });
        pl.ships.filter(sh => sh.at === city).forEach(sh => hs.push({ kind: 'ship', id: sh.id }));
        const other = hs.find(x => JSON.stringify(x) !== JSON.stringify(ui.holder));
        err(SK.transfer(pl, ui.holder, other, t.dataset.g, 10)); break;
      }
      case 'send': ui.send = t.dataset.ship; ui.tab = 'karte'; toast('Tippe auf die Zielstadt.'); break;
      case 'cancelsend': ui.send = null; break;
      case 'kontor': err(SK.buyKontor(S, pl, t.dataset.city)); break;
      case 'arm': err(SK.arm(S, pl, t.dataset.ship)); break;
      case 'sellship': err(SK.sellShip(S, pl, t.dataset.ship)); break;
      case 'buyship': { const e2 = SK.buyShip(S, pl, t.dataset.type); err(e2); if (!e2) toast('Ein neues Schiff liegt in ' + SK.C[pl.home].name + '.'); break; }
      case 'build': err(SK.build(S, pl, t.dataset.b)); break;
      case 'land': err(SK.buyLand(S, pl, +t.dataset.n)); break;
      case 'hire': err(SK.hire(S, pl, +t.dataset.n)); break;
      case 'donate': { const before = pl.ansehen; err(SK.donate(S, pl, +t.dataset.n)); if (pl.ansehen > before) toast(`Ansehen +${pl.ansehen - before}`); break; }
      case 'annual': annualDialog(pl); return;
      case 'feud': {
        const target = S.players[+t.dataset.p];
        modal(`<h2>Fehde gegen ${esc(target.name)}?</h2><p>Deine ${pl.soldiers} Soldaten gegen ${target.soldiers}${target.buildings.mauer ? ' hinter einer Stadtmauer' : ''}. Eine Fehde kostet dich in jedem Fall Ansehen.</p>
          <div class="actions"><button class="btn" data-m="no">Lieber nicht</button><button class="btn danger" data-m="yes">Angreifen</button></div>`,
        m => {
          closeModal();
          if (m !== 'yes') return;
          const r = SK.feud(S, pl, target.id);
          if (typeof r === 'string') toast(r);
          else toast(r.won ? `Sieg! ${r.land} Morgen und ${fmt(r.gold)} Gold erbeutet.` : 'Deine Truppen wurden zurückgeschlagen.');
          save(); render();
        });
        return;
      }
      case 'menu': save(); title(); return;
      default: return;
    }
    save(); render();
  }
  function trySail(pl, shipId, city) {
    const sh = pl.ships.find(x => x.id === shipId);
    if (!sh) { ui.send = null; render(); return; }
    if (city === sh.at) { toast('Das Schiff liegt schon dort.'); return; }
    const n = SK.travelTime(sh, sh.at, city);
    const e = SK.sail(S, pl, shipId, city);
    if (e) { toast(e); return; }
    ui.send = null; ui.city = city;
    save(); render();
    toast(`„${sh.name}“ segelt nach ${SK.C[city].name} – ${n} ${n === 1 ? 'Jahreszeit' : 'Jahreszeiten'}.`);
  }

  title();
})();
