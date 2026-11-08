# RetroStone – Web-Build zum Testen auf iPhone/iPad

Aus [PaddleStroke/RetroStoneVC](https://github.com/PaddleStroke/RetroStoneVC) (Commit `6116a73`), unverändert mit
Emscripten nach WebAssembly übersetzt, läuft in Safari (iPhone/iPad), Chrome und Firefox:
- **33 Arcade-Spiele** mit guter Touch-Steuerung (Liste: `tools/games.txt`), je ein Ordner `<id>/`
- **RetroStone Board** (`board/`): die Brettspiel-App mit über 200 Brett-, Karten- und Rätselspielen

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
Alle Arcade-Spiele auf einmal: `sh retrostone/tools/build_all.sh RetroStoneVC retrostone` und danach
`python3 retrostone/tools/gen_index.py retrostone` für das Menü. Das Touch-Schema jedes Spiels liest
`tools/gen_scheme.py` aus `apps/launcher/games.cfg`. Spiele mit `touch_native` bekommen die Finger direkt.

Brettspiel-App: `sh retrostone/tools/board/build_board.sh RetroStoneVC retrostone`. Dafür werden außerdem
`fonts-noto-cjk` und `fonts-dejavu-core` (apt) sowie `fonttools` (pip) gebraucht. Sie läuft ohne Threads
(`ASYNCIFY`), und der Computergegner rechnet auf dem Hauptthread (`tools/board/ai_worker_web.c`).

Hinweis: Hinter einem Proxy, der GitHub-Archive blockiert, SDL per `git clone -b release-2.32.10` holen und
`EMCC_LOCAL_PORTS=sdl2=<pfad>` setzen.

## Lizenz
Code MIT, Assets CC BY-NC-SA 4.0 (© 2026 Pierre-Louis Boyer, 8BCraft), nur nicht-kommerziell.
Die Spielnamen sind nicht lizenziert, darum ist das hier nur eine private Testseite.
