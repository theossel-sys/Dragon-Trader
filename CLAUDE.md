# Projektkontext für Claude (über Sessions hinweg)

Sprache: immer auf Deutsch antworten.

## Projekt
- **Drachenhandel**: rundenbasiertes Handelsspiel, eine einzige Datei `drachen.html` (HTML/CSS/JS, kein Framework).
- Online via GitHub Pages: https://theossel-sys.github.io/Dragon-Trader/drachen.html
- Doku: `README.md`, `Benutzerhandbuch.md`. Highscores in `localStorage`, Musik via Web Audio API.

## Verlauf
- 2026-11-08: Repo https://github.com/PaddleStroke/RetroStoneVC geprüft (Frage: iPhone/iPad-Version).
  - RetroStoneVC = SNES-artige Fantasy-Konsole in C11 (320x240), SDK MIT-lizenziert; Spiele-Assets CC BY-NC-SA
    (nicht kommerziell), Namen/Logos nicht lizenziert.
  - Hat bereits iOS-Pipeline (`apps/ios/`, SDL2, XcodeGen, GitHub-Actions-macOS-Runner, TestFlight-Upload) –
    braucht Apple Developer Program (99 USD/Jahr) für echte Geräte.
  - Fazit: Für Drachenhandel nicht sinnvoll (Komplett-Neuschreiben in C nötig). Empfehlung: PWA
    (Homescreen, offline, Vollbild) als schneller Weg; für App Store später Capacitor-Wrapper.
  - Klarstellung User: Es geht NICHT um Drachenhandel, sondern darum, RetroStoneVC-Spiele (Beispiel für
    KI-nachgebaute Spiele auf GitHub) selbst auf iPhone/iPad zu testen.
  - Plan A (bevorzugt): Web-Build per Emscripten (SDL2-Frontend `sdk/frontends/sdl2/rs_sdl.c` + ASYNCIFY;
    SDK kann Touch nativ) -> Safari auf iPhone/iPad, kein Apple-Konto nötig. Startkandidat: Leady Squid.
    User hat Plan A freigegeben. ERLEDIGT: Ordner `retrostone/` mit Web-Builds von Leady Squid, Pancake Tower,
    Beaver Rush (RetroStoneVC Commit 6116a73) + Menüseite + `tools/` (rs_web.c, shell.html, build_web.sh) + README.
    In iPhone/iPad-Emulation (Playwright) getestet: Touch, Breitbild, deutsche Texte ok.
    Build-Hinweise: GitHub-Archive über Proxy gesperrt -> SDL per git clone (Tag release-2.32.10) und
    EMCC_LOCAL_PORTS=sdl2=<pfad>; EM_ASM braucht -std=gnu11.
    Live, sobald auf main gemerged: https://theossel-sys.github.io/Dragon-Trader/retrostone/
  - Plan B: RetroStoneVC forken, vorhandene `.github/workflows/ios.yml` nutzen (macOS-Runner);
    echtes Gerät braucht Apple Developer (99 USD/Jahr) -> TestFlight; oder unsignierte IPA + Sideloadly/AltStore.
- 2026-11-08 (später): PR #1 auf main gemerged -> Seite live. User-Feedback: Umsetzung top, Spiele selbst eher
  nicht so. Komplette Spieleliste (38 Arcade-Spiele + Brettspiel-App) gezeigt, bevor weitere umgesetzt werden.
