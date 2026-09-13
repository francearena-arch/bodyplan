# BodyPlan 2.0 Beta 7.1 – QA

## Behobene Regressionen
- Heatmap konnte wegen eines nicht initialisierten `heatView`-States nicht gerendert werden.
- Nach dem Entfernen des Gewohnheiten-Bereichs war in den Einstellungen ein verwaister Toggle im Markup verblieben.

## Durchgeführte Tests
- JavaScript-Syntaxprüfung mit Node.
- Browser-Integrationstest in Chromium auf 390 × 844 px.
- Heatmap-Aufruf über die Dashboard-Kachel.
- Heatmap-Aufruf über das Burgermenü.
- Vorderseite/Rückseite-Switch.
- Heatmap-Berechnung mit einer repräsentativen gespeicherten Trainingseinheit.
- Einstellungen: exakt drei Dashboard-Schalter, kein verwaister Toggle, Gewohnheiten nicht sichtbar.
- Ein-/Ausblenden von „Letztes Training“ und Rückwirkung auf das Dashboard.
- Navigation durch Dashboard, Trainingspläne, Übungsbibliothek, Historie, Fortschritt, Muskel-Heatmap und Einstellungen.
- Prüfung auf horizontales Overflow auf Mobile.
- Prüfung aller Service-Worker-Assets und ZIP-Integrität.

## Grenze
Der Test wurde in einer isolierten Chromium-Umgebung durchgeführt. Der finale iOS-Home-Screen-/Safari-Test und der echte GitHub-Pages-Service-Worker-Lifecycle können nur auf dem Zielgerät vollständig verifiziert werden.
