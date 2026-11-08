# RetroStone VC – Web-Build zum Testen auf iPhone/iPad

Drei Spiele aus [PaddleStroke/RetroStoneVC](https://github.com/PaddleStroke/RetroStoneVC) (Commit `6116a73`):
Leady Squid, Pancake Tower und Beaver Rush. Sie wurden unverändert mit Emscripten nach WebAssembly übersetzt und
laufen in Safari (iPhone/iPad), Chrome und Firefox.

## Spielen
- Lokal: `cd retrostone && python3 -m http.server 8000` und dann `http://localhost:8000` öffnen. Über `file://`
  funktioniert es nicht, weil WebAssembly einen Webserver braucht.
- Online: Sobald der Ordner auf `main` liegt, über GitHub Pages:
  `https://theossel-sys.github.io/Dragon-Trader/retrostone/`

## Was das Web-Frontend macht (`tools/rs_web.c`)
- Hauptschleife über `requestAnimationFrame`, fester 60-Hz-Takt wie im Desktop-Runner
- Die Bildbreite folgt dem Bildschirmformat (quer = Breitbild bis 514 px); beim Drehen wird sie angepasst
- Touch: die Touch-Zonen aus `apps/launcher/games.cfg` werden zu Pad-Tasten; der Knopf „II“ pausiert
- Spielstand/Rekord in IndexedDB (IDBFS)
- Die Sprache kommt aus dem Browser (Deutsch wird automatisch gewählt)

## Neu bauen
```
git clone https://github.com/emscripten-core/emsdk && ./emsdk/emsdk install latest && ./emsdk/emsdk activate latest
source emsdk/emsdk_env.sh
git clone https://github.com/PaddleStroke/RetroStoneVC
pip install pillow numpy scipy fonttools
sh retrostone/tools/build_web.sh RetroStoneVC retrostone leadysquid "Leady Squid" "Tippen = schwimmen"
```
Weitere Spiele: Spiele, die Touch selbst lesen (z. B. `pogomamie`, `cosmocorgi`), laufen direkt. Für reine
Pad-Spiele muss ihre Zeile aus `games.cfg` in die Tabelle `SCHEMES` in `rs_web.c` eingetragen werden.

## Lizenz
Code MIT, Assets CC BY-NC-SA 4.0 (© 2026 Pierre-Louis Boyer, 8BCraft), nur nicht-kommerziell.
Die Spielnamen sind nicht lizenziert, darum ist das hier nur eine private Testseite.
