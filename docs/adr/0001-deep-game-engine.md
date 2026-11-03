# ADR 0001: Deep Game Engine Module with Injectable Persistence Adapter

- **Status:** Accepted
- **Date:** 2026-11-03

## Context

In `server.js` waren Domänenregeln (Kartenwahl, Watcher-Rollenwechsel, Deck-Wechsel, Namensvalidierung, Reconnect-Abgleich, 24-Stunden-Ablauf), Socket.IO-Event-Handler und synchrone Dateipersistenz (`fs.writeFileSync` nach `data/games.json`) ohne trennende Seam in einer einzigen 987-Zeilen-Datei verwoben:

- Socket-Handler griffen direkt auf interne `Map`-Strukturen (`game.players`, `game.votes`, `game.deck`, `game.lastActivity`) zu.
- `saveGames()` wurde an 10 Stellen manuell in den Transport-Handlern aufgerufen (und bei `leave-game` sowie `disconnect` ausgelassen).
- In-Process-Tests via `node --test` waren ohne HTTP-/Socket-Server und Dateisystem-Seiteneffekte nicht möglich.

## Decision

1. **Deep Game Engine Module (`server/gameEngine.js`):**
   - *Wenn* ein Spiel erstellt, beigetreten, gewählt, aufgedeckt, zurückgesetzt, umbenannt, in der Rolle gewechselt, verlassen oder bereinigt wird, *dann* erfolgt dies ausschließlich über das schmale Interface von `createGameEngine({ persistence, idGenerator, now })`.
   - *Wenn* eine Operation aufgerufen wird, *dann* liefert die `GameEngine` ein strukturiertes Result-Objekt `{ ok: true, state, meta }` bzw. `{ ok: false, code, message }` zurück, wobei `state` stets der serialisierbare `Public Game State` ist.
2. **Vollständige Domänen-Validierung innerhalb der Engine:**
   - *Wenn* `castVote(gameId, playerId, card)` aufgerufen wird, *dann* prüft die `GameEngine`, ob `revealed === false`, `player.isWatcher === false` und `card` im aktiven `deck.cards` enthalten ist.
   - *Wenn* `changePlayerName(gameId, playerId, newName)` aufgerufen wird, *dann* validiert die `GameEngine`, dass der getrimmte Name zwischen 1 und 20 Zeichen lang ist.
   - *Wenn* ein bereits im Spiel vorhandener Spieler erneut `joinGame` aufruft (Reconnect), *dann* erhält die `GameEngine` dessen bestehende Stimme (`hasVoted`) und aktualisiert die Rolle nur bei expliziter Abweichung.
3. **Persistence Adapter Seam (`server/persistence/jsonFileAdapter.js`):**
   - *Wenn* eine zustandsverändernde Operation in der `GameEngine` erfolgreich ausgeführt wird, *dann* aktualisiert die `GameEngine` automatisch `lastActivity` und ruft den injizierten `Persistence Adapter` (`persistence.scheduleSave(serializedGames)` bzw. `persistence.saveImmediate(serializedGames)`) auf.
   - Zwei reale Adapter nutzen diese Seam: der debounced JSON-File-Adapter für `data/games.json` in Produktion und ein synchroner In-Memory-Adapter in `node --test`.

## Consequences

- **Locality:** Alle Planning-Poker-Regeln, Invarianten und Persistenz-Trigger liegen an exakt einer Stelle (`server/gameEngine.js`).
- **Leverage:** Sämtliche Domänen- und Edge-Case-Tests laufen in Millisekunden in-process gegen das `GameEngine`-Interface ohne Socket.IO oder Dateisystem.
- **Adapter-Einfachheit:** `server.js` schrumpft auf einen dünnen HTTP-/Socket.IO-Transport-Adapter, der Events entgegennimmt, `gameEngine.*` aufruft und `result.state` broadcastet.
