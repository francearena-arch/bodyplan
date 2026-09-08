# BodyPlan 2.0 Beta 5

## Installation
1. In der bestehenden App unter Einstellungen ein Backup erstellen und die JSON-Datei sicher aufbewahren.
2. Den gesamten Inhalt dieser ZIP in das bestehende GitHub-Pages-Repository hochladen und gleichnamige Dateien ersetzen. Die Ordnerstruktur beibehalten.
3. Nach dem Deployment die App vollständig schließen und erneut öffnen. Bei einem alten Cache die Website in Safari neu laden. Die App und ihre Website-Daten nicht löschen.
4. Die neue Version mit den vorhandenen Trainings und Messwerten kontrollieren.

## Änderungen
- Anatomisch überarbeitete Brustmaske; alle anderen Muskelmasken bleiben unverändert.
- Übungsbibliothek mit primärer, sekundärer und weiterer Muskelgruppe sowie optionalen individuellen Gewichtungen.
- Körperentwicklung mit datierten Messungen, Bearbeiten, Löschen und Gewichts-/Körperfettverlauf.
- Dashboard auf drei sinnvolle Kernmodule reduziert, ergänzt um zwei dezente Navigations-Shortcuts.
- Trainingspläne ohne sichtbares Archiv; vorhandene archivierte Datensätze bleiben aus Sicherheitsgründen im lokalen Datenbestand erhalten.
- Planlöschung per Swipe und Bearbeitungsansicht, mit Bestätigung und Schutz des aktiven Plans.
- Verbesserte Datenmigration, Backup-Import, Übungssuche, responsive Darstellung und Trainingsspeicherung.

## Daten und Berechnung
Die bestehende lokale Datenbank bp4_bodyplan_v2 und die bisherigen bp3_-Daten bleiben erhalten. Es findet keine automatische Löschung historischer Trainings, Messwerte oder archivierter Pläne statt. Die Archivansicht wurde entfernt, nicht die gespeicherte Historie.

Muskelgewichtungen sind Schätzwerte. Primär = 1,0, sekundär = 0,5, weitere = 0,25. Die erweiterte Gewichtung erlaubt individuelle Werte. Gespeicherte Trainings behalten ihre damalige Muskelzuordnung, soweit diese bereits als Snapshot vorhanden ist. Änderungen an Übungen gelten für zukünftige Trainings; alte Messwerte werden nicht rückwirkend umgedeutet.

## Qualitätssicherung
Siehe QA.md. Dieses Release wurde in einem isolierten Chromium-Test und mit Logiktests geprüft. Ein Test auf dem tatsächlichen iPhone und der produktiven Hosting-Umgebung ist weiterhin erforderlich.
