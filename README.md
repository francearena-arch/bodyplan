# BodyPlan 2.0 Beta 10 – Progress Intelligence

## Schwerpunkt
Ein aussagekräftiger Fortschrittsbereich und ein vollständig konfigurierbares, bündiges Dashboard.

## Änderungen
- Neuer 8-Wochen-Trainingsblock mit Startdatum, aktueller Woche und Restlaufzeit.
- Planerfüllung aus effektiven, fälligen Einheiten; Wiederholungen derselben Einheit in derselben Blockwoche erhöhen die Quote nicht.
- Trainingsfrequenz der letzten 30 Tage im Vergleich zum aktiven Plan.
- Volumentrend: letzte 30 gegen vorherige 30 Tage, berechnet aus abgeschlossenen Arbeitssätzen (kg × Wiederholungen).
- Persönliche Bestleistungen pro Übung im aktuellen Trainingsblock.
- Priorisierter, regelbasierter nächster Fokus statt allgemeiner Statistik.
- Körperziele für Gewicht und Körperfett sind in den Einstellungen konfigurierbar.
- Verlaufsgrafiken erscheinen erst ab zwei vergleichbaren Messungen.
- Fünf einzeln schaltbare Dashboard-Kacheln: Nächste Einheit, Wochenfortschritt, Letztes Training, Dein Fortschritt und Muskel-Heatmap.
- Nächste Einheit bleibt vollbreit; alle übrigen Kacheln bilden ein Zweiersystem. Eine einzelne Restkachel spannt automatisch über die volle Breite.
- Das laufende Training bleibt unabhängig von der Dashboard-Konfiguration sichtbar.
- Bestehende Daten bleiben lokal erhalten. Bestehende aktive Pläne ohne Blockstart verlangen einmalig ein bewusst gewähltes Startdatum.

## Update
Vor dem Deployment ein Backup erstellen. Danach die sechs Release-Dateien ersetzen, die App vollständig schließen und erneut öffnen. Die bestehenden Ordner `assets` und `icons` sowie JSON-Daten nicht löschen. Bei Altbestand Safari neu laden; Website-Daten nicht löschen und die Home-Screen-App nicht deinstallieren.

## Qualitätssicherung
Siehe `QA.md`.

