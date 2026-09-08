# BodyPlan 2.0 — Beta 1

Release: 2.0.0-beta.1
Baseline: BodyPlan v44 + verified Alpha-1 migration state

## Ziel dieses Releases
BodyPlan 2.0 ist jetzt als Trainings-App nutzbar: neuer Live-Trainingsmodus, persistente aktive Session, Satz-Tracking, Resttimer, letzte Leistung, dauerhafte und Session-Notizen, Trainingshistorie und funktionierende Dashboard-Konfiguration.

## Responsive/iPhone-Hardening
- Eingabefelder sind mindestens 16 px groß, damit iOS beim Fokussieren nicht automatisch hineinzoomt.
- touch-action: manipulation für Buttons/Links/Felder gegen Double-Tap-Zoom-Artefakte.
- Keine horizontale Überbreite; Grids verwenden minmax(0,1fr) und mobile Breakpoints.
- Navigation horizontal scrollbar statt das Layout zu verbreitern.
- Header, Live-Training und Set-Zeilen besitzen eigene Mobile-Breakpoints bis 350 px.
- Pinch-Zoom wurde bewusst NICHT global deaktiviert; nur ungewolltes UI-Zooming wird vermieden.

## Behoben
- Hauptnavigation war in Alpha 1 nicht an den page state angebunden. Dadurch war insbesondere „Einstellungen → Dashboard anpassen“ praktisch nicht nutzbar. Behoben.
- Dashboard-Kacheln können ein-/ausgeblendet und sichtbare Kacheln sortiert werden.

## Live-Training
- Training A/B/C direkt vom Plan oder Dashboard starten.
- Aktive Session bleibt in bp4_alpha1 erhalten, auch wenn die Ansicht geschlossen wird.
- kg / Wiederholungen pro Satz.
- Satzabschluss explizit markieren.
- 60 / 90 / 120 / 180 Sekunden Resttimer.
- Satz hinzufügen / letzten Satz entfernen.
- Letzte gespeicherte Leistung pro Exercise-ID.
- Dauerhafte Übungsnotiz + Session-Notiz getrennt.
- Training speichern oder bewusst verwerfen.
- Nur abgeschlossene bzw. bearbeitete Sätze werden in die neue Session übernommen.

## Historie
- Migrierte v44-Sessions und neue BodyPlan-2.0-Sessions in einer gemeinsamen Historie.
- Dauer, Datum, Satzanzahl und Satzdetails.
- Legacy-Originalobjekte bleiben im Migrationsbestand erhalten.

## Datensicherheit
- Der bestehende bp4_alpha1-Datenbestand aus Alpha 1 wird weiterverwendet; dadurch bleiben die bereits auf dem iPhone geprüften Daten erhalten.
- bp3_-Legacy-Daten werden nicht überschrieben.
- Backup exportiert weiterhin Legacy-Snapshot + BodyPlan-2.0-Daten.
- v44 bleibt in legacy-v44.html als Fallback enthalten.

## Deployment
1. Das bereits erstellte externe Backup behalten.
2. Den kompletten ZIP-Inhalt deployen, nicht einzelne Dateien.
3. Bestehende Website-Dateien ersetzen, aber NICHT Browser-/Website-Daten löschen.
4. App neu öffnen. index.html leitet nun auf BodyPlan 2.0 Beta 1 weiter.
5. Prüfen, ob oben „2.0 BETA 1“ steht.
6. In Einstellungen eine Dashboard-Kachel aus-/einblenden.
7. Ein Testtraining starten, einen Satz eintragen, die App verlassen und erneut öffnen; „Training fortsetzen“ muss erscheinen.
8. Erst nach diesem Smoke-Test das erste echte Training in BodyPlan 2.0 speichern.

## Tests
- node --check alpha.js: PASS
- node --check service-worker.js: PASS
- deterministischer Legacy-Migrationstest: PASS
- deterministischer Live-Session-/Satz-Persistenztest: PASS
- ZIP-Integrität: PASS
- Ein automatisierter Browser-Test wurde versucht, aber die Laufzeitumgebung blockiert lokale Browser-Navigation administrativ. Der entscheidende On-Device-Test erfolgt deshalb auf dem iPhone.

## Noch nicht final
- neue menschenähnliche anatomische Heatmap
- neue Body-Progress-Ansicht innerhalb BodyPlan 2.0
- PR/Analytics vollständig auf bp4
- Cloud-Backend / Account / Sync

Nächster Schritt: iPhone-Smoke-Test von Beta 1, danach Beta 2 mit anatomischer Heatmap und Analytics.
