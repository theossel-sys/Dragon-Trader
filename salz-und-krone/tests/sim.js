// KI gegen KI: prüft, ob das Spiel durchläuft und wie schnell man aufsteigt.  node tests/sim.js [seeds] [jahre]
const SK = require('../engine.js');
const seeds = +process.argv[2] || 5, years = +process.argv[3] || 25;
for (let seed = 1; seed <= seeds; seed++) {
  const s = SK.newGame({ seed, years, players: [0, 1, 2, 3].map(i => ({ name: 'KI' + i, ai: true })) });
  const rankAt = s.players.map(() => []);
  while (!s.over) {
    const pl = s.players[s.cur];
    SK.aiTurn(s, pl);
    rankAt[pl.id][pl.rank] = rankAt[pl.id][pl.rank] || SK.year(s);
    SK.endTurn(s);
  }
  console.log(`Seed ${seed}: Ende ${SK.year(s)}, Sieger ${s.players[s.winner].name}`);
  s.players.forEach(pl => console.log(`  ${pl.name} ${SK.RANKS[pl.rank].name.padEnd(13)} Vermögen ${SK.fmt(SK.worth(s, pl)).padStart(8)}  Gold ${SK.fmt(pl.gold).padStart(7)}  Land ${pl.land}  Volk ${pl.pop}  Ansehen ${pl.ansehen}  Schiffe ${pl.ships.length}  Ränge in Jahren: ${rankAt[pl.id].map((y, i) => y ? i + ':' + y : '').filter(Boolean).join(' ')}`));
}
