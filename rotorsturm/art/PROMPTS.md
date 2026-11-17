# Rotorsturm – Prompts für Draw Things

## So geht's
1. **Modell:** ein SDXL-Modell (z. B. *SDXL Base* oder *Juggernaut XL*), für den Pixel-Look am besten mit der LoRA
   **„Pixel Art XL“** (Gewicht 0,8–1,0). FLUX.1 geht auch, wird aber weniger „pixelig“.
2. **Einstellungen:** 1024 × 1024 (Titelbild 768 × 1344), 25–30 Schritte (FLUX schnell: 4–6), CFG 5–7.
   **Eine feste Seed** für alle Bilder hilft, dass sie zueinander passen.
3. Jeden Prompt **plus den Stil-Zusatz** eingeben, Negativ-Prompt immer gleich.
4. Pro Bild 2–4 Varianten erzeugen und die beste nehmen. Wichtig: **genau von oben**, **ein Objekt**, **magentafarbener Hintergrund** (lässt sich sauber entfernen; weiß würde helle Motivteile mitlöschen).
5. Speichern als PNG mit dem **Dateinamen aus der Liste** (z. B. `tank.png`).
6. Hochladen: auf GitHub im Repo in den Ordner **`rotorsturm/art/incoming/`** („Add file → Upload files“) –
   oder mir einfach hier im Chat schicken. Den Rest (freistellen, verkleinern, einbauen) mache ich.

**Stil-Zusatz (an jeden Prompt hängen):**
> , 16-bit arcade game sprite, pixel art, crisp pixels, limited color palette, top-down view directly from above,
> orthographic, single object centered, isolated on a solid pure magenta background (#FF00FF), no shadow

**Negativ-Prompt (immer):**
> text, letters, watermark, logo, signature, perspective, isometric, side view, 3d render, blurry, gradient background, white background,
> drop shadow, frame, border, multiple objects, cropped

Eigene Motive – bitte keine Namen bekannter Spiele in die Prompts schreiben.

## Die Bilder

| Datei | Prompt |
|---|---|
| `heli_player.png` | small attack helicopter, red fuselage with white stripes, short stub wings with yellow tips, bubble cockpit in light blue glass, twin landing skids, two thin rotor blades crossing |
| `tank.png` | olive green battle tank seen from above, wide dark tracks on both sides, round turret in the middle, gun barrel pointing up |
| `truck.png` | small military supply truck seen from above, yellow cargo bed with a red cross mark, dark cab at the front |
| `boat.png` | small grey gunboat seen from above, pointed bow at the top, small deck cannon, white wake at the stern |
| `jet.png` | dark navy blue delta-wing fighter jet seen from above, nose pointing down, small cockpit, two engines |
| `heli_enemy.png` | green military helicopter seen from above, nose pointing down, rocket pods on short wings, three rotor blades |
| `bunker.png` | square concrete bunker seen from above, grey reinforced walls, round gun turret in the center |
| `boss_destroyer.png` | large grey naval destroyer warship seen from above, long narrow hull, bow pointing down, three gun turrets along the deck, bridge tower in the middle, tall and thin composition |
| `boss_tank.png` | enormous super-heavy fortress tank seen from above, four wide tracks, armored olive hull, two big cannon turrets at the front |
| `boss_bunker.png` | wide concrete fortress complex seen from above, thick walls, glowing orange reactor core in the center, four gun turrets at the corners, wide composition |
| `boss_heli.png` | huge dark green heavy attack helicopter seen from above, nose pointing down, long stub wings with missile pods, large three-blade rotor, menacing |
| `item_power.png` | glowing red power-up capsule icon with a bold white letter shape removed, simple round badge — *(Buchstaben fügt das Spiel selbst ein, also ohne Text)* |
| `item_bomb.png` | glowing yellow bomb power-up icon, round bomb with short fuse, simple badge |
| `item_shield.png` | glowing cyan shield power-up icon, simple round energy shield badge |

**Titelbild** (`title.png`, 768 × 1344, **ohne** „top-down“ im Stil-Zusatz und **mit** Hintergrund):
> dramatic 1980s arcade poster illustration, a red attack helicopter flying low over a stormy coastline at sunset,
> tanks and a warship below, explosions and smoke, bold colors, painted, cinematic lighting, vertical composition,
> empty space at the top for a title

Negativ-Prompt für das Titelbild: `text, letters, watermark, logo, signature, frame, border`
