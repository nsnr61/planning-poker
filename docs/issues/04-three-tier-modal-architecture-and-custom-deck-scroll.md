# 04: Three-Tier Modal Architecture, Responsive Dialog Widths & Scrollable Custom Deck Editor

**What to build:** Umbau der Modal-Dialoge (`CustomDeckEditor` und `NameChangeModal`) auf eine dreistufige Flex-Architektur mit fixiertem Header, scrollbarem Body-Container und unten angepinnter Aktionsleiste sowie erweiterten responsiven Dialogbreiten (`min(94vw, 680px)` für den `Custom Deck`-Editor, `min(92vw, 520px)` für Standard-Dialoge), sodass bis zu 15 Karteneingabefelder ohne Clipping erreichbar bleiben.

**Blocked by:** None (can start immediately)

**Status:** resolved

```css
/* Decision-rich layout contract from prototype */
.modal-content {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  width: min(92vw, 520px);
  overflow: hidden;
}

.modal-content.modal-wide {
  width: min(94vw, 680px);
}

.modal-header {
  flex-shrink: 0;
  padding: 24px 28px 16px 28px;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
  padding: 20px 28px;
}

.modal-actions {
  flex-shrink: 0;
  margin-top: auto;
  padding: 18px 28px 24px 28px;
  border-top: 1px solid var(--border-color);
  background: var(--card-bg);
}
```

- [x] **Wenn** ein Standard-Modal (z. B. `NameChangeModal`) geöffnet wird, **dann** rendert `.modal-content` als vertikale Flex-Spalte (`max-height: 85vh`, `width: min(92vw, 520px)`) mit fixiertem `.modal-header`, scrollbarem `.modal-body` und unten angepinntem `.modal-actions`-Footer.
- [x] **Wenn** der `Custom Deck`-Editor geöffnet wird, **dann** verwendet der Dialog `.modal-content.modal-wide` mit einer responsiven Breite von `min(94vw, 680px)`.
- [x] **Wenn** im `Custom Deck`-Editor bis zu 15 Karten angelegt oder bearbeitet werden, **dann** scrollt die Kartenliste innerhalb von `.modal-body` (`overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin;`), während `.modal-header` (Titel und Schließen-Button) und `.modal-actions` ("Cancel", "Create Deck" / "Update Deck") jederzeit ohne Scrollen sichtbar und bedienbar bleiben.
- [x] **Wenn** auf Viewports `<= 600px` ein Modal geöffnet wird, **dann** reduziert sich das horizontale Innen-Padding von Header, Body und Footer auf `20px`, während die Aktionsbuttons (`gap: 12px`) klar getrennt bleiben.
- [x] **Wenn** der Benutzer außerhalb des Dialogs auf `.modal-overlay` klickt oder `Escape` drückt, **dann** schließt sich der Dialog zuverlässig unabhängig von der Scroll-Position des `.modal-body`.
- [x] **Wenn** `CustomDeckEditor` (mit 15 Kartenslots) und `NameChangeModal` in Komponenten-Tests gerendert werden, **dann** sind alle 15 Karteneingabefelder, die dreistufigen Struktur-Container (`.modal-header`, `.modal-body`, `.modal-actions`) sowie die primären und sekundären Aktionsbuttons im DOM vorhanden, fokussierbar und interaktiv.
