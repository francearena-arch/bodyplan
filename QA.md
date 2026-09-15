# BodyPlan 2.0 Beta 10.1 – QA

## Automatisch geprüft
- JavaScript-Syntax von App und Service Worker.
- Beta-10-Cache-Version und Cache-Busting.
- Datenmigration von bisherigen Dashboard-Einstellungen auf fünf Kacheln.
- Erhalt bestehender Sessions, Pläne, Übungen und Körpermessungen.
- Startdatum bei neu aktiviertem Plan; kein erfundenes Datum bei bestehendem aktivem Plan.
- Dashboard-Raster für gerade und ungerade Kachelanzahl.
- Leerer Dashboard-Zustand und dauerhaft sichtbare Karte eines laufenden Trainings.
- Fortschrittszustände mit und ohne Blockstart, Trainingsdaten, Volumenvergleich, PR und Körpermessungen.
- Eingabeprüfung für Zielbereiche und Blockstart.
- Zürcher Lokalzeit für neue Trainings und Wochenabgrenzung.
- Zeitanteilige Planerfüllung an Blocktag 1, 3, 7 und 8.
- Korrektur und Abbruch der Startdatum-Änderung.
- Volumentrend-Schwelle mit weniger beziehungsweise mindestens vier vergleichbaren Einheiten.
- PR-Ausgangsbasis ohne automatische Bestleistung beim ersten Training.
- Reduzierte Heatmap-Kachel ohne sekundäre Kennzahlen.

## Manuell auf dem Zielgerät prüfen
1. Backup erstellen und Beta 10.1 über Beta 10 installieren.
2. Prüfen, dass Trainingslog, Pläne, Messungen und Heatmap-Daten vorhanden sind.
3. Im Fortschritt den Blockstart setzen und die vier Kennzahlen plausibilisieren.
4. In Einstellungen jede der fünf Kacheln einzeln an- und ausschalten.
5. Dashboard mit 1, 2, 3 und 4 kleinen Kacheln prüfen; bei ungerader Zahl muss die letzte Kachel vollbreit sein.
6. Ein Training starten, App schließen, erneut öffnen und Fortsetzen/Speichern testen.
7. Sommer-/Winterzeit und Uhrzeit im Trainingslog stichprobenartig prüfen.
8. Home-Screen-PWA einmal vollständig schließen und neu öffnen, damit der Beta-10-Service-Worker aktiv wird.

## Bekannte Grenze
Körpergewichtsübungen ohne eingetragenes Gewicht zählen als Arbeitssätze, aber nicht zum kg-Volumen. Der Home-Screen-PWA- und Service-Worker-Lifecycle muss nach dem Deployment auf dem Ziel-iPhone geprüft werden.
