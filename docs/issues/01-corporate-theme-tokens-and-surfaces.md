# 01: Corporate Theme Tokens, Flächenhierarchie und Kontrast-Typografie

**What to build:** Vollständige Umstellung des Light- und Dark-Modes auf die Corporate-Design-Farbpalette (`#991355` & `#f2f2f2`) inklusive klarer Trennung zwischen Flächen-Akzent (`--accent-color`) und Text-Akzent (`--accent-text`) sowie automatischer `localStorage`-Persistenz beim Theme-Wechsel.

**Blocked by:** None (can start immediately)

**Status:** resolved

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

- [x] **Wenn** die Anwendung im Light Mode geladen wird, **dann** erscheinen Seitenhintergrund und sekundäre Blöcke in `#f2f2f2`, Karten-Container in `#ffffff`, Rahmen in `#d9d9d9` und Primärakzente in `#991355` ohne den bisherigen blau-violetten Farbverlauf.
- [x] **Wenn** der Dark Mode (`[data-theme="dark"]`) aktiv ist, **dann** nutzen Oberflächen neutrale Dunkelgrau-Abstufungen (`#18181b`, `#1e1e22`, `#242429`, `#323238`) und gefüllte Primärflächen weiterhin `#991355`.
- [x] **Wenn** Akzent-Typografie (Statistik-Kennzahlen für Average/Fibonacci/Total Votes, Stimmenanzahl in der Verteilung und Footer-Links) dargestellt wird, **dann** nutzt sie `var(--accent-text)` (`#991355` im Light Mode, `#e05297` im Dark Mode), während Balkenfüllungen (`.vote-bar-fill`) weiterhin `var(--accent-color)` verwenden.
- [x] **Wenn** der Theme-Umschalter betätigt wird, **dann** wechselt `document.documentElement.getAttribute('data-theme')` zwischen `'dark'` und `null` und persistiert `'dark'` bzw. `'light'` in `localStorage` (abgesichert durch einen Komponenten-Test).
