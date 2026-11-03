# ADR 0002: Modernisierung auf Express 5, Node Native Crypto, Vite 8, Vitest und React 19

- **Status:** Accepted
- **Date:** 2026-11-03

## Context

Create React App (`react-scripts@5.0.1`) im Client ist abgekündigt, verursachte 73 Sicherheitslücken (`npm audit`, davon 13 High) und blockierte durch veraltete Peer-Dependencies das Upgrade auf React 19. Im Backend erzeugte `uuid@10` eine CVE (`GHSA-w5hq-g745-h8pq`) und brach ab `uuid@11+` mit CommonJS (`require`), während `express@4` auf dem alten `path-to-regexp` stand.

## Decision

1. **Backend (`package.json`, `server.js`, `server/gameEngine.js`):**
   - *Wenn* HTTP-Routing und Catch-All-Delivery im Backend erfolgen, *dann* wird `express@^5.3.0` mit der `path-to-regexp`-v8-Syntax `app.get('{*splat}', ...)` eingesetzt.
   - *Wenn* eine neue `gameId` generiert wird, *dann* nutzt `server/gameEngine.js` das Node-Built-in `crypto.randomUUID().substring(0, 8)` anstelle des externen Pakets `uuid`.
   - *Wenn* `nodemon` als Dev-Dependency installiert wird, *dann* erzwingt `overrides.minimatch: "^11.0.1"` eine verwundbarkeitsfreie transitive Auflösung.
2. **Frontend Build & Runtime (`client/`):**
   - *Wenn* das Frontend gestartet, gebaut oder getestet wird, *dann* kommen `vite@^8.x`, `@vitejs/plugin-react@^6.x`, `vitest@^5.x` (`jsdom`) sowie `react@^19.3.1` und `react-dom@^19.3.1` zum Einsatz (`react-scripts` und `web-vitals` entfallen).
   - *Wenn* `vite build` ausgeführt wird, *dann* schreibt Vite nach `client/build` (`build.outDir: 'build'`), sodass `server.js` und `Dockerfile` ohne Pfadbruch denselben Artefakt-Ordner ausliefern.
   - *Wenn* eine Datei unter `client/src/` JSX-Syntax enthält, *dann* trägt sie die Dateiendung `.jsx` (`index.jsx`, `App.jsx`, `components/*.jsx`), während reine Logik-Module (`services/`, `hooks/`, `stores/`, `utils/`) `.js` behalten.
