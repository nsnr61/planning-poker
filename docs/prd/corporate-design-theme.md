# Corporate Design Theme (#991355 & #f2f2f2)

Status: ready-for-agent

## Problem Statement

Die Planning-Poker-Anwendung verwendet derzeit ein generisches Standard-Farbschema mit einem auffälligen blau-violetten Hintergrundverlauf (`#667eea` bis `#764ba2`), inkonsistenten Bootstrap-ähnlichen Button-Farben (grelles Gelb, Smaragdgrün, Violett) sowie mehrfach hartcodierten Hex-Farbwerten in Stylesheets und Modals. Dadurch weicht das Erscheinungsbild stark vom Corporate Design des Hauptprodukts (`lab@ccess` mit Primärfarbe `#991355` und Sekundär-/Flächenfarbe `#f2f2f2`) ab, und im Dark Mode führen hartcodierte Farben in Modals sowie mangelnde Textkontraste bei Akzentfarben zu Darstellungsproblemen.

## Solution

Das Light- und Dark-Theme der Anwendung wird ohne Änderung der bestehenden Spielfunktionen (`Game`, `Round`, `Card Deck`, `Custom Deck`, `Player`, `Watcher`, `Consensus`, `Public Game State`) vollständig auf das Corporate Design umgestellt:
- **Wenn** der Light Mode aktiv ist, **dann** verwendet die Anwendung eine ruhige, flache Flächenhierarchie aus `#f2f2f2` (Seitenhintergrund und verschachtelte Blöcke), `#ffffff` (Karten-Container und Modals), `#d9d9d9` (Rahmen) und `#991355` (Primärakzent).
- **Wenn** der Dark Mode aktiv ist, **dann** verwendet die Anwendung neutrale dunkelgraue Oberflächen (`#18181b` / `#242429`), behält `#991355` für gefüllte Primärelemente (Buttons, gewählte Schätzkarte) bei und nutzt ein aufgehelltes Berry (`#e05297`) für Akzent-Texte und Links zur Sicherstellung eines hohen Lesekontrasts.
- **Wenn** Buttons, Modals, Kartenrücken und das Konsens-Konfetti dargestellt werden, **dann** folgen sie durchgängig der Corporate-Farbhierarchie ohne verbleibende hartcodierte Fremdfarben.

## User Stories

1. As a **Player**, I want the Light Mode page background to use a flat neutral gray (`#f2f2f2`) with clean white content containers (`#ffffff`), so that the application visually matches our corporate product (`lab@ccess`).
2. As a **Player**, I want primary interactive elements (such as "Create a Game", "Join the Game", "Share Link", and "Start New Round") to be styled in the corporate primary color (`#991355` with `#7d0f45` hover in Light Mode and `#b31964` hover in Dark Mode), so that main call-to-action buttons are immediately recognizable.
3. As a **Player**, I want secondary controls (such as switching between `Player` and `Watcher` role, editing a `Custom Deck`, or canceling a modal dialog) to use a subtle neutral gray button style (`#f2f2f2` / `#e6e6e6` in Light Mode, `#323238` in Dark Mode), so that secondary actions do not visually compete with primary actions or status indicators.
4. As a **Player**, I want active status and confirmation actions (such as "Reveal Votes" when votes are ready, the currently active `Card Deck` badge, and the `Consensus` banner) to use a refined semantic green (`#2e7d32` in Light Mode, `#388e3c` in Dark Mode), so that round readiness and active states remain clearly distinguishable from primary navigation/actions.
5. As a **Player**, I want the selectable estimation cards in the `Card Deck` to highlight with a `#991355` border and subtle berry shadow on hover, and fill with `#991355` and white text when selected, so that my current estimate during a `Round` is clearly visible in corporate colors.
6. As a **Player** or **Watcher**, I want the face-down playing card back of participants in a `Game` to be tinted in the `#991355` corporate tone while preserving its white filigree pattern, so that unrevealed cards harmonize with the rest of the interface.
7. As a **Watcher**, I want the watcher card back to use the corporate primary color (`#991355`), so that observer cards blend seamlessly into the participant grid.
8. As a **Player** or **Watcher**, I want the Dark Mode (`[data-theme="dark"]`) to render neutral dark gray surfaces (`#18181b` background, `#242429` cards, `#3a3a42` borders), so that estimations in low-light environments are comfortable without color cast.
9. As a **Player** or **Watcher**, I want accent text elements in Dark Mode (such as average and Fibonacci statistics, vote counts, and footer links) to use a brightened berry tone (`#e05297`), so that text and numbers remain highly legible against dark surfaces while preserving brand identity.
10. As a **Player**, I want all modal dialogs (changing player name and creating/editing a `Custom Deck`) to use theme CSS variables for backgrounds, text, borders, focus rings, and action buttons instead of hardcoded colors, so that modals look consistent in both Light Mode and Dark Mode.
11. As a **Player**, I want form inputs and dropdown selects across setup, game room, and modals to display a `#991355` border and subtle focus ring when focused, so that keyboard and pointer navigation reflects the corporate design.
12. As a **Player** or **Watcher**, I want the `Consensus` confetti animation to use a coordinated corporate palette (`#991355`, `#7d0f45`, `#c22570`, `#e05297`, `#f2cadb`, `#595959`), so that reaching `Consensus` in a `Round` feels cohesive with the brand.
13. As a **Player** or **Watcher**, I want the theme toggle to switch seamlessly between Light Mode and Dark Mode and persist the selection in `localStorage`, so that all corporate color tokens update immediately without page reload.

## Implementation Decisions

- **Zentrales CSS-Token-System (Light & Dark Theme):**
  - **Wenn** das Root-Stylesheet geladen wird, **dann** definiert `:root` das Light-Theme und `[data-theme="dark"]` das Dark-Theme über semantische CSS Custom Properties:

```css
/* Decision-rich token contract */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f2f2f2;
  --bg-tertiary: #e6e6e6;
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-muted: #8c8c8c;
  --border-color: #d9d9d9;
  --card-bg: #ffffff;
  --card-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  --accent-color: #991355;
  --accent-hover: #7d0f45;
  --accent-text: #991355;
  --accent-subtle: #f7eaf0;
  --accent-shadow: rgba(153, 19, 85, 0.28);
  --success-color: #2e7d32;
  --warning-color: #d97706;
  --danger-color: #c62828;
  --gradient: #f2f2f2;
}

[data-theme="dark"] {
  --bg-primary: #18181b;
  --bg-secondary: #1e1e22;
  --bg-tertiary: #323238;
  --text-primary: #f2f2f2;
  --text-secondary: #b3b3b8;
  --text-muted: #7a7a85;
  --border-color: #3a3a42;
  --card-bg: #242429;
  --card-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  --accent-color: #991355;
  --accent-hover: #b31964;
  --accent-text: #e05297;
  --accent-subtle: rgba(153, 19, 85, 0.25);
  --accent-shadow: rgba(153, 19, 85, 0.45);
  --success-color: #388e3c;
  --warning-color: #f59e0b;
  --danger-color: #e53935;
  --gradient: #18181b;
}
```

- **Trennung von Flächen-Akzent (`--accent-color`) und Text-Akzent (`--accent-text`):**
  - **Wenn** ein Element `#991355` als Hintergrundfläche mit weißer Schrift nutzt (`.btn`, `.poker-card.selected`, `.vote-bar-fill`, `.watcher-card-back`), **dann** verwendet es `var(--accent-color)` in beiden Themes.
  - **Wenn** ein Element die Akzentfarbe als Vordergrund-/Schriftfarbe auf `--card-bg` oder `--bg-secondary` nutzt (`.stat-value`, `.vote-count`, Footer-Links), **dann** verwendet es `var(--accent-text)`, damit im Dark Mode (`#e05297` auf `#242429` / `#1e1e22`) der Kontrast erhalten bleibt.

- **Konsolidierung der Button-Hierarchie:**
  - **Wenn** eine primäre Aktion dargestellt wird ("Create a Game", "Join the Game", "Share Link", "Start New Round", inaktive `Card Deck`-Auswahlbuttons, "Create Custom Deck", Modal-Submit "Save" / "Create Deck" / "Update Deck"), **dann** wird die Standard-/Primärklasse (`.btn` bzw. `.btn-primary`) mit `var(--accent-color)` und weißer Schrift verwendet.
  - **Wenn** eine sekundäre Aktion dargestellt wird ("Switch to Watcher" / "Switch to Player", "Edit Custom Deck", "Add Card", Modal-"Cancel"), **dann** wird `.btn-secondary` verwendet, gestaltet als neutraler Corporate-Button (`background: var(--bg-tertiary)`, `color: var(--text-primary)`, `border: 1px solid var(--border-color)`).
  - **Wenn** der Reveal-Button aktivierbar ist (`canReveal === true`) oder ein `Card Deck` aktuell aktiv ausgewählt ist, **dann** wird `.btn-success` (`var(--success-color)`) verwendet.

- **Bereinigung hartcodierter Farben in Stylesheets und Modals:**
  - **Wenn** `.poker-card` gehovert oder ausgewählt wird, **dann** werden die bisherigen `#667eea`- und `rgba(102, 126, 234, ...)`-Regeln durch `var(--accent-color)` und `var(--accent-shadow)` ersetzt.
  - **Wenn** ein Modal geöffnet wird, **dann** beziehen `.modal-content`, `.modal-header h3`, `.modal-close`, `.form-group label`, `.form-group input` und `.modal-actions` sämtliche Farben aus den CSS-Variablen (`--card-bg`, `--text-primary`, `--text-secondary`, `--border-color`, `--accent-color`, `--accent-subtle`), wodurch die bisherigen hartcodierten Werte (`#ffffff`, `#1a1a1a`, `#3b82f6`, `#10b981`) entfallen.

- **Kartenrücken & Konsens-Konfetti:**
  - **Wenn** der verdeckte Kartenrücken gerendert wird, **dann** wird das bestehende Ornament-Asset über CSS (`background-color: var(--accent-color)` in Kombination mit Blend-Mode/Overlay in `.card-back::before`) in den Corporate-Farbton `#991355` eingefärbt, sodass die weiße Linienzeichnung erhalten bleibt.
  - **Wenn** `Consensus` erreicht wird und das Konfetti startet, **dann** übergibt die Komponente das Corporate-Farbarray `['#991355', '#7d0f45', '#c22570', '#e05297', '#f2cadb', `#595959`]`.

## Testing Decisions

- **Was einen guten Test ausmacht:**
  - Tests prüfen ausschließlich das von außen beobachtbare Verhalten an der Komponenten-Grenze (gerenderte DOM-Elemente, semantische Rollen/Klassen, `data-theme`-Attribut auf `document.documentElement`, `localStorage`-Synchronisation und übergebene Props an das Konfetti-Subsystem), nicht interne CSS-Implementierungsdetails.
- **Test-Seam (Single Seam):**
  - Eine einzige Integrations-Seam auf UI-Container-Ebene (`GameRoom` + `ThemeToggle` unter Vitest und React Testing Library mit gemocktem Socket-Service gemäß Projekt-Teststandard):
    1. **Wenn** `ThemeToggle` betätigt wird, **dann** wechselt `document.documentElement.getAttribute('data-theme')` zwischen `'dark'` und `null` und speichert `'dark'` bzw. `'light'` in `localStorage`.
    2. **Wenn** `GameRoom` im aktiven oder aufgedeckten Zustand (`revealed`) gerendert wird, **dann** tragen Primäraktionen ("Share Link", "Start New Round") die Primär-Button-Klassen und Sekundäraktionen ("Switch to Watcher" / "Switch to Player", "Edit Custom Deck") die `.btn-secondary`-Klasse.
    3. **Wenn** `Consensus` bei aufgedeckten Stimmen (`revealed === true`) vorliegt, **dann** wird das Konsens-Banner angezeigt und das Konfetti mit der Corporate-Farbpalette initialisiert.
- **Prior Art im Repository:**
  - Bestehende Komponenten-Tests mit Vitest + `@testing-library/react` für das `Card Deck` sowie die Build-Verifikation (`npm run build`).

## Out of Scope

- Änderungen an der Backend-Logik (`GameEngine`, `Persistence Adapter`, Socket.IO-Events).
- Änderungen am Layout-Raster, der Komponenten-Hierarchie oder den Benutzer-Flows.
- Bearbeitung oder Bereinigung veralteter Refactoring-Artefakte.

## Further Notes

- Die Einhaltung von ADR 0002 (Vite 8, Vitest, React 19, `.jsx`-Komponenten) und der Schichtenarchitektur (`GameProvider` -> `useGame` / `useConnection` / `useGameStore` -> `socketService`) bleibt vollständig gewahrt.
