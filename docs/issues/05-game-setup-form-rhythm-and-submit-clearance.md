# 05: Game Setup Form Group Rhythm & Submit Action Clearance

**What to build:** Harmonisierung der vertikalen Formularabstände (`.form-group`) und deutliche Abgrenzung der primären Submit-Buttons ("Create a Game", "Join the Game") gegenüber vorangehenden Eingabefeldern, `Watcher`-Optionen und der `Card Deck`-Vorschau im Setup-Screen.

**Blocked by:** 04: Three-Tier Modal Architecture, Responsive Dialog Widths & Scrollable Custom Deck Editor

**Status:** ready-for-agent

- [x] **Wenn** Formulargruppen (`.form-group`) im Setup-Screen (`GameSetup`) oder in Modal-Dialogen gerendert werden, **dann** nutzen sie einen einheitlichen unteren Abstand (`margin-bottom: 24px`) sowie klar abgesetzte Labels (`margin-bottom: 8px; font-weight: 500;`).
- [x] **Wenn** im Setup-Screen ein neues `Game` erstellt wird, **dann** sind Namenseingabe, `Watcher`-Checkbox und `Card Deck`-Auswahl inklusive `.deck-preview` sauber in Formulargruppen strukturiert.
- [x] **Wenn** der primäre Submit-Button ("Create a Game" bzw. "Join the Game") im Setup-Formular gerendert wird, **dann** besitzt er einen dedizierten oberen Abstand (`margin-top: 20px` bis `24px`) zu den darüberliegenden Formular- und Vorschau-Elementen.
- [x] **Wenn** die Karten-Vorschau (`.deck-preview`) unterhalb des `Card Deck`-Auswahlfelds angezeigt wird, **dann** halten die Vorschau-Karten (`.deck-preview-card`) einen sauberen Abstand (`gap: 8px`, `margin-top: 12px`) zum Auswahlfeld und zum nachfolgenden Submit-Button ein.
- [x] **Wenn** `GameSetup` im Create- und Join-Modus in Komponenten-Tests gerendert wird, **dann** sind sämtliche Formulargruppen und der Submit-Button korrekt strukturiert und bei Auswahl verschiedener `Card Deck`-Optionen uneingeschränkt bedienbar.
