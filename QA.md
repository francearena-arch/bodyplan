# Beta 5 – Qualitätsprüfung

## Durchgeführt
- JavaScript-Syntaxprüfung.
- Logiktests für Plan-Duplikation, Löschung, Schutz des aktiven Plans und Erhalt der Trainingshistorie.
- Tests für primäre, sekundäre und weitere Muskelgewichtung sowie historische Muskel-Snapshots.
- Tests für Körpermessungen, Verlauf, Bearbeiten/Löschen und Datenbank-Normalisierung.
- Chromium-Integrationstest: Dashboard, Planverwaltung, Übungsbibliothek, Körperdaten, Heatmap, Einstellungen und Trainingsspeicherung.
- Responsive Overflow-Prüfung der Hauptansichten bei 320, 375, 390, 430 und 768 Pixeln.
- Visuelle Prüfung der Vorder- und Rückseitenbilder sowie der Brustmaske. Die übrigen Masken wurden nicht verändert.
- Überprüfung der referenzierten Dateien und ZIP-Integrität.

## Grenzen
Die Browserprüfung verwendet eine isolierte lokale Testumgebung. Ein vollständiger Test des Service-Worker-Update-Lebenszyklus auf GitHub Pages, der iOS-Home-Screen-PWA, der nativen Swipe-Gesten und der echten Bestandsdaten auf dem iPhone war hier nicht möglich. Die App ist deshalb als Beta und nicht als vollständig produktionszertifizierte Anwendung gekennzeichnet.

## Vor dem produktiven Einsatz
Backup erstellen, Release deployen, vorhandene Daten kontrollieren und die zentralen Abläufe auf dem iPhone testen. Bei Abweichungen das Backup behalten und keine Website-Daten löschen.
