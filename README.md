# 🐉 Drachenhandel

Ein mittelalterliches Handelsspiel im Browser — reise durch die Zauberlande, kaufe günstig, verkaufe teuer und werde reich!

[![Spiel starten](https://img.shields.io/badge/▶_Spiel_starten-online-gold?style=for-the-badge)](https://theossel-sys.github.io/Dragon-Trader/drachen.html)

---

## Über das Spiel

Drachenhandel ist ein rundenbasiertes Handelsspiel, das komplett im Browser läuft — keine Installation, keine Abhängigkeiten, eine einzige HTML-Datei.

Du reist als Händler durch sechs magische Städte, kaufst Waren dort, wo sie günstig sind, und verkaufst sie dort, wo sie teuer gehandelt werden. Ziel: In 12 Runden mindestens 500 Goldmünzen anhäufen.

### Features

- **6 magische Städte** mit je einer günstigen Spezialware (⭐)
- **8 handelbare Waren** — von Drachenstaub bis zur Drachenschuppe
- **Reputationssystem** — je öfter du eine Stadt besuchst, desto besser werden deine Preise (bis zu 5 Sterne, je +3%)
- **Zufallsereignisse** auf Reisen: Räuberüberfälle, Glücksfunde, Wanderhändler, Gewitter, Stadtfeste, Drachenbegegnungen
- **Mittelalterliche Musik** via Web Audio API (An/Aus-Schalter oben rechts)
- **Bestenliste** im localStorage — wer kommt auf Platz 1?
- **Mobilfreundlich** — läuft auf Desktop und Smartphone

---

## Spielprinzip

| Was | Wie |
|-----|-----|
| **Reisen** | Klicke auf eine Stadt in der Karte — kostet Gold und eine Runde |
| **Kaufen** | Klicke "Kaufen" in einem Warenfeld — landet im Rucksack |
| **Verkaufen** | Klicke "Verkaufen" — sofortiger Verkauf zum Stadtpreis |
| **Gewinnen** | 500 🪙 bis Rundenende erreichen |

Der Rucksack fasst **6 Gegenstände**. Plane deine Route!

---

## Städte & Spezialwaren

| Stadt | Typ | Günstige Ware |
|-------|-----|---------------|
| 🏔️ Drachenfels | Drachenhort | ✨ Drachenstaub |
| 🌲 Elfenwald | Elfensiedlung | 🌟 Elfenpulver |
| 💧 Kristallsee | Wasserreich | 💎 Zauberkristall |
| 🌋 Feuerberg | Zwergenstadt | 🔥 Feuergold |
| 🌙 Mondturm | Zauberburg | 🌕 Mondstein |
| ⚡ Sturmklippe | Hexendorf | ⚡ Blitzkraut |

---

## Technisches

- Reines HTML/CSS/JavaScript — kein Framework, keine Dependencies
- Musik: Web Audio API (pentatonisches D-Moll-Arpeggio mit Echo)
- Highscores: `localStorage` (nur lokal gespeichert)
- Schriftarten: [UnifrakturMaguntia](https://fonts.google.com/specimen/UnifrakturMaguntia), [Cinzel](https://fonts.google.com/specimen/Cinzel), [Crimson Text](https://fonts.google.com/specimen/Crimson+Text) via Google Fonts

---

## Lokal spielen

Einfach `drachen.html` herunterladen und im Browser öffnen — fertig.

```bash
git clone https://github.com/theossel-sys/Dragon-Trader.git
open Dragon-Trader/drachen.html
```

---

*Viel Erfolg, tapferer Händler!* 🐉
