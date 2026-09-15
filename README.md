# BodyPlan 2.0 Beta 9

## Schwerpunkt
Kalenderbasierter Trainingslog mit Zürcher Lokalzeit und eine Heatmap aus ausschließlich effektiven Trainingsdaten.

## Änderungen
- Monatskalender mit Trainingstagen, Startzeit, Dauer, Arbeitssätzen und Trainingsvolumen.
- Neue Sessions speichern `Europe/Zurich`; Sommer- und Winterzeit werden automatisch berücksichtigt.
- Heatmap-Zeiträume 7, 30 und 90 Tage.
- Vergleichbarer Wochendurchschnitt statt relativer 100%-Normalisierung.
- Nur Sessions mit abgeschlossenen Arbeitssätzen zählen für Log, Wochenfortschritt und Heatmap.
- Leere Pläne, leere Einheiten und leere Trainings werden blockiert.
- Bestehende Trainingsdaten bleiben erhalten.

## Update
Vor dem Deployment ein Backup erstellen. Danach alle Release-Dateien ersetzen, die App vollständig schließen und erneut öffnen. Bei Altbestand Safari neu laden. Website-Daten nicht löschen und die Home-Screen-App nicht deinstallieren.

## Qualitätssicherung
Siehe QA.md.

