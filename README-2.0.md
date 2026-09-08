# BodyPlan 2.0 — Alpha 1

Basis: unveränderte v44-Dateien, ergänzt um einen isolierten Alpha-Arbeitsbereich.
Release: 2.0.0-alpha.1

## Installation
1. Vor dem Deployment in der bisherigen App einen vollständigen Datenexport erstellen und außerhalb des iPhones sichern.
2. Den gesamten ZIP-Inhalt in dasselbe HTTPS-Verzeichnis wie die bisherige App deployen. Nicht nur index.html austauschen.
3. Die bisherige App öffnen und über „BODYPLAN 2.0 ALPHA“ den neuen Arbeitsbereich aufrufen.
4. Im Alpha zuerst „Backup“ ausführen und die JSON-Datei extern sichern.
5. Den importierten Plan und die dauerhaften Notizen prüfen. Erst danach eigene Pläne bearbeiten.
6. Training weiterhin in v44 aufzeichnen. Alpha 1 besitzt bewusst noch keine neue Session-Engine.

## Enthalten
- 51 Übungen aus v44 und dem neuen A/B/C-Plan, mit editierbaren Muskelgewichtungen.
- Neuer Drei-Tage-Plan mit 48 Arbeitssätzen, Alternativen und Supersatz-Gruppe.
- Flexible Pläne, Einheiten, Übungsreihenfolge, Satzanzahl, Wiederholungsbereiche und Aufwärmsätze.
- Dauerhafte Übungsnotizen und separate planbezogene Notizen.
- Dashboard-Kacheln aktivieren/deaktivieren und sortieren; optionale Gewohnheiten.
- Einmalige, nicht destruktive Migration von bp3_ nach bp4_alpha1.
- Original-Sessions und Legacy-Key-Snapshot im Alpha-Datenbestand.
- Vollständiger JSON-Export und Alpha-Import mit vorherigem Sicherheitsbackup.

## Grenzen
- Kein neuer Live-Trainingsmodus, keine neue anatomische Heatmap und keine Cloud-Synchronisation.
- Analytics-Kacheln ohne neue Session-Engine sind ausdrücklich Platzhalter.
- Die Migration kann historische Übungsnamen nicht immer eindeutig zuordnen; ungeklärte Übungen werden separat angelegt.
- Historische Satzdaten ohne expliziten Abschlussstatus werden als gespeicherte Arbeitssätze übernommen; das ist eine Legacy-Annahme.
- Nicht mehr vorhandene Notizen können nicht rekonstruiert werden.
- Der erste Alpha-Start übernimmt den damaligen bp3-Stand. Spätere v44-Einträge werden nicht automatisch synchronisiert.
- Die neue Übungsbibliothek enthält geschätzte Muskelgewichtungen, keine physiologisch gemessenen Aktivierungswerte.
- Kein Test auf dem iPhone durchgeführt. Node-Syntax und deterministische Migrationstests wurden ausgeführt.

## Datensicherheit
Alpha schreibt ausschließlich bp4_alpha1. Der ursprüngliche v44-Code und sämtliche bp3-Keys bleiben erhalten.
Der Export enthält Trainings- und Körperdaten und sollte privat aufbewahrt werden.
Eine PWA kann bei Browser-/Website-Datenlöschung lokale Daten verlieren. Vor einem Hosting-, Domain- oder App-Wechsel immer extern sichern.
Die alte App nicht deinstallieren oder Website-Daten löschen, bevor die Migration auf dem echten Gerät geprüft ist.

## Nächster Meilenstein
Alpha 2: neue Session-Engine, atomare Speicherung, vollständige Historienmigration, letzte Leistung, Timer, Satzabschluss und Tests auf dem iPhone. Danach anatomische Heatmap.
