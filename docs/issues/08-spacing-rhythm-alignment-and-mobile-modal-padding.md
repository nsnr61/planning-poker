# 08: Spacing Rhythm Alignment & Mobile Modal Padding Spec Harmonization

**What to build:** Harmonisierung und Korrektur verbleibender Spec-Abweichungen aus den Tickets 04–06: Spezifische Reduzierung des horizontalen Innen-Paddings für `.modal-body` auf mobilen Viewports (`<= 600px`), uneingeschränkte Beibehaltung von `margin-bottom: 24px` bei allen `.form-group`-Elementen im Setup-Formular, Vereinheitlichung des Schätzkarten-Gaps auf `12px` auf mobilen/Tablet-Viewports (`<= 768px`) sowie Bereinigung der Triage-Labels in den lokalen Issue-Dateien.

**Blocked by:** 07: Reusable Modal Lifecycle Hook & CSS Button Group Deduplication

**Status:** ready-for-agent

- [x] **Wenn** ein modaler Dialog auf mobilen Viewports (`<= 600px`) dargestellt wird, **dann** reduziert `.modal-body` spezifisch das horizontale Padding auf `20px` (`padding: 20px 20px`), ohne das im Three-Tier-Layout definierte vertikale Innen-Padding zu verfälschen.
- [x] **Wenn** das Setup-Formular (`GameSetup`) gerendert wird, **dann** besitzt jede `.form-group` (einschließlich der letzten vor dem Submit-Button) standardmäßig `margin-bottom: 24px`, während der Submit-Button (`.setup-submit-btn`) seinen dedizierten oberen Abstand (`margin-top: 24px`) beibehält.
- [x] **Wenn** das Schätzkarten-Grid (`.card-selection-grid`) auf Viewports `<= 768px` gerendert wird, **dann** beträgt der Zeilen- und Spaltenabstand (`gap`) konsistent `12px` wie auf Desktop-Displays.
- [x] **Wenn** die Issue-Dateien unter `docs/issues/` geprüft werden, **dann** nutzen alle Statusangaben ausschließlich das kanonische Label-Vokabular (`ready-for-agent`, `needs-triage`, `needs-info`, `ready-for-human`, `wontfix`).
- [x] **Wenn** `GameSetup`, `CardDeck`, `GameRoom` und die modalen Dialoge in Komponenten-Tests ausgeführt werden, **dann** verifizieren die Tests die korrekte Struktur und das harmonisierte Abstandsverhalten.
