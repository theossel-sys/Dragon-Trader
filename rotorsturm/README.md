# Rotorsturm

Ein eigener, senkrecht scrollender Hubschrauber-Shooter im Stil der 80er-Arcades, im Browser, für iPhone/iPad und
Desktop. Alle Grafiken (Pixel-Sprites, Gelände, Pixelschrift, Endgegner) und die Chiptune-Musik werden per Code
erzeugt; es sind keine fremden Dateien enthalten.

## Spielen
`index.html` über einen Webserver öffnen (z. B. `python3 -m http.server`). Auf dem iPhone: Safari →
„Teilen → Zum Home-Bildschirm“.

- **Handy:** Finger irgendwo auf dem Bildschirm ziehen = fliegen (der Finger verdeckt den Heli nicht). Feuer automatisch,
  roter Knopf = Bombe, „II“ = Pause.
- **PC:** Pfeiltasten/WASD, Leertaste = Bombe, P = Pause.

## Inhalt
- 4 Zonen mit eigenem Gelände und Endgegner: Küste (Zerstörer), Wald mit Fluss (Festungspanzer), Industrie
  (Bunkerwerk), Flugfeld (Kampfhubschrauber „Sturmbrecher“). Danach beginnt eine neue Runde, schwieriger.
- Gegner: Panzer, Lastwagen (bringen Extras), Kanonenboote, Bunker, Jet-Formationen, Hubschrauber.
- Extras: **P** Feuerkraft (4 Stufen), **B** Bombe, **S** Schild. Extraleben bei 50.000 Punkten, dann alle 70.000.
- Rekord wird im Browser gespeichert.

## Technik
`index.html` (Menüs), `game.js` (alles andere). Testzugang für automatische Prüfungen: `window.__rotor`.
