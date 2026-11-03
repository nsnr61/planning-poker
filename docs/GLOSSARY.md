# Domain Glossary (`planning-poker`)

Verbindliches Domänen-Vokabular für Code, Tests, ADRs (`docs/adr/`) und Spezifikationen (`docs/prd/`, `docs/issues/`).

## Kernbegriffe

- **Game Engine (`GameEngine`):**
  Zentrales In-Process-Domänenmodul (`server/gameEngine.js`), das den Lebenszyklus aller aktiven Spiele (`Game`), sämtliche Spielregeln, Validierungen, den 24-Stunden-Ablauf sowie die Benachrichtigung des `Persistence Adapter` hinter einem schmalen Interface kapselt.
- **Game (`Game`):**
  Eine einzelne Planning-Poker-Schätzsession, identifiziert durch eine 8-stellige `gameId`. Enthält Teilnehmende (`players`), abgegebene Stimmen (`votes`), das aktive `Card Deck`, ein optionales `Custom Deck`, den Aufdeckstatus (`revealed`) sowie Zeitstempel (`createdAt`, `lastActivity`).
- **Player (Voter):**
  Teilnehmende Person mit Stimmrecht (`isWatcher === false`).
  - *Wenn* `revealed === false` und die gewählte Karte im aktiven `Card Deck` enthalten ist, *dann* kann ein Player eine Stimme (`castVote`) abgeben oder ändern.
- **Watcher (Observer):**
  Teilnehmende Person ohne eigenes Stimmrecht (`isWatcher === true`).
  - *Wenn* ein Player in die Rolle `Watcher` wechselt (`toggleRole`), *dann* wird eine bereits abgegebene Stimme aus `votes` entfernt und `hasVoted` auf `false` gesetzt.
  - *Wenn* geprüft wird, ob alle abgestimmt haben (`allVoted`), *dann* werden Watcher ignoriert.
- **Card Deck (`CARD_DECKS` / `deck`):**
  Geordnete Menge gültiger Schätzkarten für eine Runde. Vordefinierte Decks sind `fibonacci`, `tshirt`, `powersOf2` und `linear`.
  - *Wenn* das aktive `Card Deck` gewechselt oder editiert wird, *dann* wird die laufende Runde zurückgesetzt (`resetGame`).
- **Custom Deck (`customDeck`):**
  Benutzerdefiniertes Kartendeck eines Spiels mit getrimmtem Namen und nicht-leeren Kartenwerten.
- **Round (Schätzrunde):**
  Zyklus aus verdeckter Stimmabgabe (`revealed === false`), Aufdecken (`revealVotes` -> `revealed === true`) und Zurücksetzen (`resetGame` -> `votes` geleert, `revealed === false`, alle `hasVoted === false`).
- **Consensus (Konsens):**
  Zustand nach `revealVotes`, bei dem mindestens zwei gültige Stimmen vorliegen und alle abgegebenen Stimmen denselben Kartenwert aufweisen.
- **Public Game State:**
  Serialisierbare Projektion eines `Game` für Clients und HTTP-Endpunkte (`players` als Array, `votes` als Objekt).
  - *Wenn* `revealed === false` ist, *dann* enthält `Public Game State` ein leeres `votes`-Objekt (`{}`), während `player.hasVoted` anzeigt, wer bereits gewählt hat.
  - *Wenn* `revealed === true` ist, *dann* enthält `Public Game State` sämtliche Einträge aus `votes`.
- **Persistence Adapter:**
  Austauschbarer Adapter hinter der Persistenz-Seam der `GameEngine`.
  - *Wenn* eine zustandsverändernde Operation in der `GameEngine` erfolgreich abgeschlossen wird, *dann* übergibt die `GameEngine` den serialisierten Zustand an den `Persistence Adapter` (in Produktion: debounced JSON-Dateipersistenz nach `data/games.json`; in Tests: In-Memory-Adapter).
