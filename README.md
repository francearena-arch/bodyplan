# BodyPlan 2.0 Beta 8

## Schwerpunkt
Beta 8 ersetzt die bisherigen beschrifteten Anatomie-Grafiken durch neue, saubere und transparente Front-/Rückansichten. Es gibt keine eingebrannten Texte, Linien oder schwarzen Bildflächen mehr. Die Heatmap-Overlays wurden auf die neuen Anatomie-Proportionen neu registriert.

## Update
1. In BodyPlan unter Einstellungen ein Backup erstellen und sicher aufbewahren.
2. Den kompletten Inhalt dieser ZIP in das bestehende GitHub-Pages-Repository hochladen und gleichnamige Dateien ersetzen.
3. Nach erfolgreichem Deployment die App vollständig schließen und erneut öffnen. Bei sichtbarem Altbestand die Website in Safari neu laden. Website-Daten nicht löschen und die Home-Screen-App nicht deinstallieren.

## Daten
Die lokale BodyPlan-Datenbank und bestehende Trainings-/Körperdaten werden nicht automatisch gelöscht. Dieses Release verändert die Heatmap-Assets und deren Darstellung, nicht die gespeicherten Trainingsdaten.

## Heatmap
- separate transparente Front- und Rückansicht, jeweils 768 × 1024 px
- keine eingebrannten Beschriftungen oder Verbindungslinien
- neu registrierte Muskelmasken passend zu den neuen Körperproportionen
- bestehender Front-/Back-Switch und Belastungsberechnung bleiben erhalten
- Canvas und Bildasset besitzen keinen eigenen schwarzen Rechteck-Hintergrund

## Qualitätssicherung
Siehe QA.md.
