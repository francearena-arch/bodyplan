# Beta 8 – Qualitätsprüfung

## Geprüft
- JavaScript-Syntaxprüfung.
- ZIP-Integrität.
- alle vom Service Worker referenzierten Assets vorhanden.
- Front- und Rückseitenasset exakt 768 × 1024 Pixel.
- transparente Außenbereiche der beiden Anatomy-PNGs geprüft.
- Masken exakt 768 × 1024 und auf dieselbe Gruppen-ID-Reihenfolge wie die App geprüft.
- Browser-Test der Heatmap-Navigation über Dashboard und Burgermenü.
- Front-/Back-Switch im Browser getestet.
- dynamische Heatmap mit Test-Trainingsdaten für Vorder- und Rückseite gerendert.
- Einstellungen und übrige Hauptnavigation auf JavaScript-Laufzeitfehler geprüft.

## Grenze
Der Test erfolgt in einer Chromium-Testumgebung. Die finale visuelle Kontrolle auf der iOS-Home-Screen-PWA und der produktiven GitHub-Pages-URL muss nach dem Deployment auf dem iPhone erfolgen.
