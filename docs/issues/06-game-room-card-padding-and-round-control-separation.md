# 06: Game Room Card Padding, Section Margins & Round Control Separation

**What to build:** Standardisierung der Abstände und Innen-Paddings aller Haupt-Karten (`.card`, `.game-stats-revealed`) auf Desktop und Mobile sowie klare visuelle Trennung zwischen Runden-Aktionen ("Reveal Votes", "Start New Round"), Rollenwechsel (`Player` / `Watcher`), `Watcher`-Banner, `Card Deck`-Konfiguration und Statistik-Anzeige im Spielraum.

**Blocked by:** 04: Three-Tier Modal Architecture, Responsive Dialog Widths & Scrollable Custom Deck Editor

**Status:** ready-for-agent

- [x] **Wenn** Haupt-Container (`.card`, `.game-stats-revealed`) auf Desktop-Viewports gerendert werden, **dann** verwenden sie standardmäßig `margin-bottom: 28px` und `padding: 28px` (Light Mode und Dark Mode).
- [x] **Wenn** die Anwendung auf mobilen Viewports (`<= 600px`) dargestellt wird, **dann** skalieren `.card` und `.game-stats-revealed` auf `margin-bottom: 20px` und `padding: 20px`.
- [x] **Wenn** ein `Player` während einer `Round` (`revealed === false`) Schätzkarten im `Card Deck` (`.card-selection-grid`) sieht, **dann** halten die Karten-Buttons saubere Zeilen- und Spaltenabstände für präzise Touch- und Mausbedienung ein.
- [x] **Wenn** `GameControls` gerendert wird, **dann** besitzen die primären Runden-Aktionen ("Reveal Votes" / "Waiting for votes...", "Start New Round") und der Rollenwechsel-Button ("Switch to Watcher" / "Switch to Player") einen klaren Abstand (`gap: 12px`, `margin-bottom: 20px` bis `24px`) zum darunterliegenden `.deck-selector` bzw. zum `Watcher`-Hinweisbanner.
- [x] **Wenn** der `.deck-selector` im nicht aufgedeckten Zustand (`revealed === false`) gerendert wird, **dann** hat er einen dedizierten oberen Abstand (`margin-top: 24px`) und strukturiert die `Card Deck`-Buttons sowie die `.custom-deck-actions` ("Create Custom Deck" / "Edit Custom Deck") mit konsistentem Button-Gap (`12px`).
- [x] **Wenn** nach `revealVotes` die `GameStats` angezeigt werden, **dann** weisen `.stats-summary`, `.stat-highlight` und `.distribution-grid` harmonisierte Abstände zwischen Kennzahlen-Karten und Stimmenbalken auf.
- [x] **Wenn** `GameControls` und `GameRoom` in Komponenten-Tests gerendert werden, **dann** verifizieren die Tests die semantische Container-Struktur und Bedienbarkeit der Runden-, Rollen- und `Card Deck`-Aktionen.
