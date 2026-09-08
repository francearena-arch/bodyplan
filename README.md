# BodyPlan 2.0 Beta 6

## Update
1. In der bisherigen App unter Einstellungen ein JSON-Backup erstellen und sicher aufbewahren.
2. Den vollständigen Inhalt dieser ZIP in das bestehende Repository hochladen und gleichnamige Dateien ersetzen. Die Ordnerstruktur beibehalten.
3. Nach dem Deployment die App schließen und erneut öffnen. Bei einem alten Cache die Website in Safari neu laden. Keine Website-Daten löschen und die Home-Screen-App nicht deinstallieren.
4. Vorhandene Trainings, Pläne, Übungen, Notizen und Körpermessungen kontrollieren.

## Änderungen
- Neue Trainingspläne werden über ein integriertes Formular angelegt und enthalten direkt eine erste bearbeitbare Einheit.
- Der redundante zweite Erstellen-Button wurde entfernt.
- Übungen werden über einen durchsuchbaren Bibliotheksdialog ausgewählt. Muskelgruppen- und Equipmentfilter, Mehrfachauswahl und eine Anzeige bereits verwendeter Übungen erleichtern die Planung.
- Derselbe Dialog wird zum Ersetzen einer Übung verwendet. Neue Übungen können direkt im Dialog mit Name, Equipment und primärer Muskelgruppe angelegt werden.
- Der funktionslose Gewohnheitenbereich wurde aus den Einstellungen entfernt. Historische Daten bleiben erhalten.
- Planaktionen sind auf kleinen Displays übersichtlicher angeordnet. Der aktive Plan zeigt keine irreführende Lösch-Swipe-Aktion.
- Navigation setzt die Scrollposition zurück, während Eingaben und Übungsauswahl ihren Kontext behalten.

## Daten
Die Datenbank bp4_bodyplan_v2 und vorhandene bp3_-Daten bleiben unverändert kompatibel. Es findet keine automatische Löschung historischer Daten statt. Die Anatomie-Assets und die Muskelgewichtungslogik entsprechen Beta 5. Ein Backup-Import ersetzt weiterhin die aktuellen Daten und erfordert eine Bestätigung.

## Qualitätssicherung
Siehe QA.md. Browser- und Logiktests wurden durchgeführt. Ein abschließender Test auf dem tatsächlichen iPhone und der produktiven Hosting-Umgebung bleibt erforderlich.
