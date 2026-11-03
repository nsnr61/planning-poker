# 02: Corporate Button-Hierarchie, Formular-Fokus und Modal-Theming

**What to build:** Durchgängige Vereinheitlichung aller primären, sekundären und statusbezogenen Aktions-Buttons im `Game` sowie vollständige Umstellung der Modal-Dialoge (Namensänderung und `Custom Deck`-Editor) und Formularfelder auf die Corporate-Theme-Variablen.

**Blocked by:** 01: Corporate Theme Tokens, Flächenhierarchie und Kontrast-Typografie

**Status:** ready-for-agent

- [ ] **Wenn** primäre Aktionen gerendert werden ("Create a Game", "Join the Game", "Share Link", "Start New Round", inaktive `Card Deck`-Auswahlbuttons, "Create Custom Deck" sowie Modal-Submit-Buttons "Save", "Create Deck", "Update Deck"), **dann** verwenden sie den Primär-Button-Stil (`.btn` / `.btn-primary`) in `var(--accent-color)` (`#991355`) mit weißer Schrift.
- [ ] **Wenn** sekundäre Aktionen gerendert werden ("Switch to Watcher" / "Switch to Player", "Edit Custom Deck", "Add Card" sowie Modal-"Cancel"), **dann** verwenden sie `.btn-secondary` als neutralen Corporate-Button (`background: var(--bg-tertiary)`, `color: var(--text-primary)`, `border: 1px solid var(--border-color)`).
- [ ] **Wenn** Stimmen aufdeckbereit sind (`canReveal === true` bei "Reveal Votes") oder ein `Card Deck` aktuell aktiv ausgewählt ist, **dann** wird die Bestätigungsfarbe `.btn-success` (`var(--success-color)`) verwendet.
- [ ] **Wenn** ein Modal-Dialog (Spielername ändern oder `Custom Deck` erstellen/bearbeiten) im Light oder Dark Mode geöffnet wird, **dann** beziehen Container, Überschrift, Schließen-Button, Labels, Eingabefelder und Aktionsbuttons ihre Farben vollständig aus den Theme-Variablen ohne hartcodierte Fremdfarben (`#ffffff`, `#1a1a1a`, `#3b82f6`, `#10b981`).
- [ ] **Wenn** ein Texteingabefeld oder Auswahlfeld fokussiert wird, **dann** erhält es einen Rahmen in `var(--accent-color)` (`#991355`) und einen dezenten Fokus-Ring in `var(--accent-subtle)`.
- [ ] **Wenn** die Spielraum-Steuerung im aktiven und im aufgedeckten Zustand (`revealed`) getestet wird, **dann** verifizieren Komponenten-Tests die korrekte Zuweisung der Primär-, Sekundär- und Success-Button-Klassen.
