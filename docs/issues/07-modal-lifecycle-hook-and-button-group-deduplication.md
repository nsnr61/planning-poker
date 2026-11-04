# 07: Reusable Modal Lifecycle Hook & CSS Button Group Deduplication

**What to build:** Extraktion der duplizierten Modal-Lifecycle-Logik (Body-Scroll-Lock via `overflow: hidden`, Cleanup bei Unmount und globaler `Escape`-Key-Listener) aus `CustomDeckEditor` und `NameChangeModal` in einen gemeinsamen Hook `useModalDismiss` sowie Konsolidierung redundanter Flex- und Button-Abstandsregeln (`.round-actions`, `.deck-buttons-group`, `.custom-deck-actions`) in `client/src/App.css`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] **Wenn** ein modaler Dialog (`CustomDeckEditor`, `NameChangeModal`) gemountet wird, **dann** sperrt `useModalDismiss` das Scrollen des Dokuments (`document.body.style.overflow = 'hidden'`) und stellt beim Unmounten den Ursprungszustand (`'unset'`) wieder her.
- [x] **Wenn** ein modaler Dialog geöffnet ist und der Benutzer die Taste `Escape` drückt, **dann** fängt `useModalDismiss` das Tastaturevent ab und löst die übergebene Schließen-/Abbrechen-Callback-Funktion aus.
- [x] **Wenn** `CustomDeckEditor` und `NameChangeModal` gerendert werden, **dann** nutzen beide Komponenten denselben `useModalDismiss`-Hook ohne duplizierte `useEffect`-Event-Listener.
- [x] **Wenn** Button-Gruppen in `GameControls` (`.round-actions`, `.deck-buttons-group`, `.custom-deck-actions`) gerendert werden, **dann** nutzen sie konsolidierte CSS-Regeln mit einheitlichem `gap: 12px` und flexibler Umbruchsteuerung ohne redundante Mehrfachdeklarationen in `client/src/App.css`.
- [x] **Wenn** der Hook und die Modal-Komponenten in Komponenten-Tests ausgeführt werden, **dann** verifizieren die Tests das zuverlässige Schließen per `Escape` sowie das Mount-/Unmount-Verhalten des Body-Scroll-Locks.
