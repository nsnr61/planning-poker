# 03: Corporate Schätzkarten, Kartenrücken und Konsens-Konfetti

**What to build:** Gestaltung der auswählbaren Schätzkarten im `Card Deck`, der verdeckten Kartenrücken von `Player` und `Watcher` sowie des `Consensus`-Konfettis im Corporate-Farbschema (`#991355`).

**Blocked by:** 01: Corporate Theme Tokens, Flächenhierarchie und Kontrast-Typografie

**Status:** ready-for-agent

- [ ] **Wenn** ein `Player` während einer `Round` (`revealed === false`) über eine Schätzkarte im `Card Deck` hovert, **dann** zeigt die Karte einen Rahmen in `var(--accent-color)` (`#991355`) und einen Schatten in `var(--accent-shadow)` statt der bisherigen `#667eea`-Werte.
- [ ] **Wenn** eine Schätzkarte im `Card Deck` ausgewählt ist (`.poker-card.selected`), **dann** wird sie flächig in `var(--accent-color)` (`#991355`) mit weißer Schrift und `var(--accent-shadow)` dargestellt.
- [ ] **Wenn** die verdeckte Spielkarte eines `Player` oder die Karte eines `Watcher` gerendert wird, **dann** erscheint der Kartenrücken im Corporate-Farbton `#991355` (`var(--accent-color)`), wobei das weiße Linienornament auf dem verdeckten Kartenrücken erhalten bleibt.
- [ ] **Wenn** nach `revealVotes` ein `Consensus` erreicht wird, **dann** zeigt der Spielraum das Konsens-Banner in `var(--success-color)` und initialisiert das Konfetti mit der Corporate-Farbpalette `['#991355', '#7d0f45', '#c22570', '#e05297', '#f2cadb', '#595959']` (abgesichert durch einen Komponenten-Test).
