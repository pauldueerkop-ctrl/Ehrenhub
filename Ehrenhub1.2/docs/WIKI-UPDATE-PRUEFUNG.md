# Wiki-Redaktion – Übergabe und Prüfung

Technischer Stand: 22.10.2026 · Projektversion 0.3.0.

## Geliefert

- Vollständiger Projektordner mit unverändertem Build-Einstieg und fertig erzeugter HTML-Vorschau.
- Zwölf bisherige Wiki-Artikel als einzelne Dateien in thematischen Unterordnern. Artikelinhalt, IDs und Reihenfolge bleiben erhalten.
- Drei neue Beispielartikel mit allen sechs interaktiven Bausteinen sowie passenden Reaktionen.
- `data/wiki/ARTIKEL-VORLAGE.json`, standardmäßig Entwurf, mit sämtlichen klassischen und neuen Bausteinen.
- Vollständige `data/wiki/START-HIER.txt` für die Redaktion und `UPLOAD-ANLEITUNG.txt` im Projektordner.
- Automatische Artikelsammlung, Entwurfsfilter und genaue Dateipfade bei fehlerhaften Inhalten.
- Stabile Abschnitts-/Punkt-IDs für neue Checklisten, ohne alte Speicherkennungen zu ändern.
- Volltextsuche auch in Bausteintexten; keine Suche in Hubi-Nachrichten oder technischen IDs.
- Kontextnachrichten am Artikel/Baustein, allgemeine Ersatztexte in `data/hubi.json`. Keine KI-API, kein Tracking.

Reaktionen sind ein gemeinsamer Mechanismus, kein zusätzlicher `type`: erklärendes Feedback, Abschlussanzeige, Hubis Text und dezente Erfolgsanimation. Die bisherigen lokalen „hilfreich“-Schaltflächen bleiben erhalten.

## Automatisierte Prüfung

`npm test` baut die vollständige Website und führt **110 Tests** aus. Zusätzlich ist `npm run validate` separat ausführbar.

Abgedeckt sind unter anderem:

- Alle bisherigen Tests für Suche, Filter, Routen, Merkliste, SOS, Speicher und Ereignisbehandlung.
- Schichtplan-Berechnung, harte Vorgaben, Konflikte, Import/Export, CSV-Maskierung, grafische Seitenaufteilung und PDF-Vorschau-Steuerung.
- Rekursives Laden neuer Artikel, Ignorieren von Vorlage und Entwürfen, bevorzugte Reihenfolge und Dateinamenprüfung.
- Doppelte IDs, fehlerhaftes JSON, ungültige Statuswerte und Nachrichtenfelder.
- Gültigkeit der vollständigen Artikelvorlage und des kopierbaren Minimalbeispiels in `START-HIER.txt`.
- Alle Zustandsübergänge der sechs Bausteine, Rücksprünge, Neustart, Sortiergrenzen und Mehrfachklicks.
- Erreichbarkeit und Zyklen im Entscheidungsweg, vollständige Lösungsreihenfolge, sichere Textausgabe.
- Hubi-Fallbackreihenfolge und stabile Checklisten-IDs.
- Eigenständiges HTML ohne nachzuladende JavaScript-/CSS-/JSON-Dateien; Build auch aus abweichendem Arbeitsverzeichnis.

## Browserprüfung

In der lokalen Chromium-Vorschau tatsächlich durchgeklickt:

- Szenario: Start, Denkanstoß, hilfreiche Antwort, Erklärung, situationsabhängige Hubi-Sprechblase und Konfetti.
- Fehlerdetektiv: neutrale Karte, Fund, wiederholter Klick ohne Doppelzählung, vollständiger Abschluss.
- Vergleich und Perspektiven: Inhalte umschalten, Zustand bei Seitennavigation behalten.
- Checkliste: drei Punkte abhaken, Fortschritt prüfen; Häkchen bleiben nach Neuladen erhalten.
- Entscheidungsweg: verschiedene Zweige, Zurück, Ergebnis und Link zum Schichtplaner.
- Mini-Challenge: Hinweis bei ungeordneter Liste, Umsortieren per Klick und Enter, Fokus am Listenrand, korrekter Abschluss.
- Suche nach einem Begriff, der nur im neuen Vergleichstext vorkommt: passender Artikel wird gefunden.
- SOS: Hubi bleibt verborgen.
- Bestehender Schichtplaner: Beispiel laden, 28 von 28 Plätze regelkonform besetzen, grafische Exportvorschau öffnen.

Desktop-Screenshots wurden visuell kontrolliert. Die neuen Module wurden außerdem in eingebetteten Testfenstern mit 360 und 768 Pixel Breite bedient. Die Seiten hatten darin keinen horizontalen Überlauf. Dies ist ein responsive Layouttest, kein Test auf echten iOS-/Android-Geräten. Im auf die lokale Website gefilterten Fehlerprotokoll wurden keine Anwendungsfehler beobachtet.

## Vergleich mit dem Ausgangspaket

Gegen den hier verfügbaren lokalen Stand mit verbessertem Stundenplan-Export geprüft:

- Alle zwölf ursprünglichen Artikel sind als JSON-Objekte inhaltlich identisch.
- `src/styles.css`, `src/icons.js`, `src/template.html` sind bytegleich.
- Alle sechs Dateien unter `src/features/schichtplan/` sind bytegleich.
- Die sechs Katalogdateien für Anträge, Fortbildungen, SOS, Finder, Quellen und Site-Metadaten sind bytegleich.
- Insgesamt wurden 15 bestehende Design-/Schichtplan-/Katalogdateien bytegleich verglichen.
- Bestehender Speicherpräfix `ehrenhub.v1.` bleibt unverändert.

Zusätzliche Gestaltung liegt ausschließlich in `src/features/wiki/styles.css`. Die Artikelansicht und der Browser-Controller wurden um die neuen Bausteine, stabile Checklisten und Hubi-Ereignisse ergänzt. Das Wiki-Filterergebnis enthält jetzt zusätzlich die drei Demoartikel. Die bisherigen pauschalen Beispielhinweise bleiben bewusst stehen.

## Grenzen und verbleibende Abnahme

- Keine fachliche oder rechtliche Freigabe der bestehenden Wiki-, Förder-, Kurs- oder Präventionsinhalte. Externe Angebote/Links wurden in diesem Auftrag nicht neu recherchiert.
- Kein Login, keine Redaktion im Browser mit Rich-Text-Editor, keine zentrale Rückmeldestatistik und keine geteilte Datenbank.
- Aufgabenstände bleiben nur im aktuellen Tab bis zum Neuladen; Checklisten und bisherige lokale Daten bleiben im Browserspeicher, soweit verfügbar.
- Die Mini-Challenge ist eine Reihenfolgeaufgabe mit einer festgelegten Lösung. Kein freies Quiz-/Drag-and-drop-System.
- Druck-CSS für neue Bausteine berücksichtigt den aktuellen sichtbaren Zustand. Die neuen Aufgaben sind keine interaktiven PDF-Formulare. Der reale Betriebssystem-Druckdialog wurde für dieses Update nicht erneut bis zu einer gespeicherten PDF-Datei durchlaufen.
- Keine vollständige Screenreader-, Barrierefreiheits- oder Cross-Browser-Zertifizierung. Vor einem regulären Release mit echten Zielgeräten und Testlesenden prüfen.
- Der Paketstand basiert auf den hier vorhandenen Dateien. Zwischenzeitliche Änderungen im Live-GitHub-Repository wurden nicht abgerufen oder automatisch zusammengeführt.
- Nichts wurde extern veröffentlicht. Workflow und Hosting-Einstellungen wurden nicht verändert. Temporäre responsive Testseite und Vorschaukonfiguration sind nicht Bestandteil des ZIP-Pakets.
