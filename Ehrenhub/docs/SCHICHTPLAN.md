# Schichtplaner – Bedienung und technischer Stand

Lokales Feature auf Basis des überarbeiteten Ehrenhub-Projekts, 18. Oktober 2026. Keine neuen npm-Pakete, keine APIs, keine KI-Abfragen und kein Backend. Die bestehende GitHub-Pages-Konfiguration bleibt bestehen.

## Schnell ausprobieren

1. Die neu gebaute `Ehrenhub.html` öffnen.
2. In der Navigation **Schichtplaner** auswählen.
3. **Beispiel ausprobieren** lädt ein fiktives Fest mit 16 Personen und drei Bereichen.
4. **Schichtplan erstellen** anklicken.
5. Einen Namen fixieren und neu berechnen; dann unter **Team** eine Verfügbarkeit ändern und erneut planen.
6. **Projekt sichern**, **Projekt öffnen**, **CSV exportieren** und **Drucken / PDF** ausprobieren.

## Die fünf Schritte

| Schritt | Was du einstellen kannst |
| --- | --- |
| Veranstaltung | Name, Ort, Beginn, Ende und Standard-Schichtlänge. Mehrtägige Veranstaltungen und Schichten über Mitternacht sind möglich. |
| Arbeitsbereiche | Je Bereich eigener Zeitraum, Schichtlänge und Personenzahl. Das Zeitraster wird erzeugt; einzelne Schichten lassen sich bearbeiten, ergänzen und löschen. |
| Team | Namen einzeln oder als Liste. Standard: alle Bereiche, jederzeit verfügbar. Pro Person Bereiche abwählen, Zeitfenster ausschalten, freie Sperrzeiten setzen und automatische / maximale / exakte Schichtanzahl wählen. |
| Verteilung | Möglichst gleiche Arbeitszeit (Standard) oder möglichst gleiche Anzahl. Pausen können bei ansonsten gleicher Belastung bevorzugt werden. |
| Dein Plan | Besetzung prüfen, Namen in Auswahlfeldern ändern, Zuteilungen fixieren und neu berechnen. Eine persönliche Belastungsübersicht zeigt Schichtanzahl und Stunden. |

Die Zahl „Plätze“ meint die benötigten Einsätze: Eine Schicht mit drei Helfern hat drei Plätze. Persönliche Vorgaben zählen Einsätze, nicht Stunden. „Genau 0“ oder „höchstens 0“ nimmt eine Person aus der Verteilung.

Gleichnamige Personen bitte unterscheidbar benennen, beispielsweise „Alex M.“ und „Alex S.“. Wiederholte Namen beim Einfügen werden übersprungen.

### Änderungen und Fixierungen

- Eine Fixierung hält **Person + Schicht** fest, nicht die Reihenfolge im Auswahlfeld.
- Änderungen an Zeiten, Bereichen, Besetzung, Team oder persönlichen Bedingungen verwerfen den berechneten Plan und seine Fixierungen. Eingaben und Team bleiben erhalten. Vor größeren Änderungen eine Projektdatei sichern.
- Änderungen nur am Veranstaltungsnamen, Ort, Anzeigenamen oder Bereichsnamen verwerfen den Plan nicht.
- Änderungen am Verteilungsmodus gelten bei der nächsten Berechnung.
- Ein geänderter Veranstaltungszeitraum verschiebt vorhandene Schichten nicht automatisch. Deren Zeiten müssen weiterhin innerhalb der Veranstaltung liegen.
- Beim manuellen Tausch zuerst einen der Plätze leeren, damit nicht zwischenzeitlich dieselbe Person doppelt eingeteilt ist.

## Was die Berechnung garantiert – und was nicht

Ein als vollständig gekennzeichneter Plan wird nach der Berechnung nochmals geprüft:

- Anzahl der benötigten Personen je Schicht;
- keine Doppelbelegung innerhalb einer Schicht und keine zeitgleichen Einsätze;
- Freigabe für den Arbeitsbereich und keine überschneidende Sperrzeit;
- persönliche Maximal- und Exakt-Vorgaben;
- Beibehaltung gültiger Fixierungen.

Die Berechnung verwendet eine begrenzte Backtracking-Suche. Zuerst werden schwer besetzbare Schichten berücksichtigt, dann möglichst wenig belastete Personen. Eine anschließende lokale Verbesserung kann Ungleichgewichte verringern. Gleiche Eingaben führen grundsätzlich zur gleichen Reihenfolge der Vorschläge; „neu verteilen“ ist kein Zufallsmodus.

Die Suche ist zeitlich und durch eine Knotenzahl begrenzt (standardmäßig etwa eine Sekunde plus ein kurzer Fallback; auf langsameren Geräten kann ein einzelner Berechnungsschritt länger dauern). „Kein vollständiger Plan gefunden“ ist **kein mathematischer Beweis**, dass es keinen geben kann. Komplexe Fälle können weitere Modellierung oder einen stärkeren Solver brauchen.

Bei einer Teillösung bleiben Plätze offen. Es werden keine Überschneidungen, ausgeschlossenen Bereiche oder Maximalvorgaben zugunsten einer vollen Tabelle akzeptiert. Nicht erreichte Exakt-Vorgaben werden als offener Punkt ausgewiesen. Ein bereits gültiger Plan bleibt erhalten, wenn eine Neuberechnung keinen gültigen Ersatz findet.

Arbeitszeitgleichheit und Pausen sind Optimierungsziele, keine Garantien. Es gibt insbesondere keine garantierte Mindestpause, keine rechtliche Prüfung, keine Qualifikations- oder Altersprüfung und keine automatisch geprüften Aufsichtsregeln. Diese Anforderungen müssen organisatorisch berücksichtigt werden.

Alle Zeiten sind lokale Uhrzeiten ohne Zeitzonenumrechnung. Bei Veranstaltungen genau über eine Sommer-/Winterzeitumstellung unterscheiden sich Uhrzeitdauer und tatsächlich vergangene Zeit; dieser Sonderfall ist nicht modelliert.

Eingabegrenzen: 120 Personen, 24 Bereiche, 400 Schichten, 1.200 Plätze, 30 Personen je Schicht. Das sind Schutzgrenzen, kein Leistungsversprechen für jede Kombination. Der getestete 30-Personen-Fall mit 90 einstündigen Einsätzen ließ sich vollständig und mit drei Einsätzen pro Person verteilen.

## Speicherung und Export

Es gibt **einen aktuellen Plan je Browserprofil und Website-Adresse**. Eingaben werden in `localStorage` unter `ehrenhub.v1.shiftPlan` gesichert. Kein zentraler Server, keine gemeinsame Bearbeitung und keine automatische Übertragung auf andere Geräte. Mehrere Browser-Tabs sollte man nicht gleichzeitig zum Bearbeiten desselben Plans verwenden.

- **Projekt sichern:** JSON-Datei mit Eingaben, Regeln, Zuteilungen und Fixierungen. Damit kann man später weiterarbeiten oder auf ein anderes Gerät wechseln.
- **Projekt öffnen:** prüft Format, Größenlimits, Datumswerte und Verweise. Die bestehende Planung wird nach Rückfrage ersetzt. Maximal 2 MB.
- **CSV:** vollständiger Plan mit allen Bereichen. Trennzeichen Semikolon und UTF-8-BOM für verbreitete Tabellenprogramme. Namen mit Formel-Präfixen werden neutralisiert; fehlende Besetzung steht als `OFFEN` darin.
- **PDF:** verwendet die Druckfunktion des Browsers. Als Ziel „Als PDF speichern“ wählen; kein separater PDF-Dienst. Druckansicht enthält den vollständigen Plan und persönliche Übersichten, unabhängig vom Bildschirmfilter. Unvollständige Pläne tragen einen Entwurfshinweis.

Lokale Speicherung kann durch Browser-Einstellungen scheitern oder durch Löschen der Website-Daten verschwinden. In diesem Fall erscheint ein Hinweis; Projektdateien sind die zuverlässigere Sicherung. Bei Wechsel von einer lokalen HTML-Datei auf GitHub Pages entstehen getrennte Browser-Speicher – Projekt exportieren und wieder importieren.

Vornamen und Verfügbarkeiten können personenbezogene Daten sein. Sie werden hier nicht hochgeladen, sind aber nicht verschlüsselt im Browser abgelegt. Andere Personen mit demselben Browserprofil können darauf zugreifen. Exportierte Dateien enthalten diese Daten. **Keine echten Team-Projektdateien, CSVs oder PDFs in ein öffentliches Repository hochladen.** Das Feature ist keine datenschutzrechtliche Freigabe.

## Aufbau: Was gehört wohin?

| Datei | Aufgabe |
| --- | --- |
| `src/features/schichtplan/model.js` | Datenmodell, Zeitraum- und Eingabeprüfung, Import, JSON- und CSV-Erzeugung |
| `src/features/schichtplan/solver.js` | Reine Planungslogik ohne Browserzugriff |
| `src/features/schichtplan/view.js` | Formulare, Schritte, Ergebnis und Druckansicht |
| `src/features/schichtplan/controller.js` | Klicks und Eingaben, lokale Speicherung, Downloads, Anbindung der Berechnung |
| `src/features/schichtplan/styles.css` | Eigenes, responsives CSS auf Basis der Ehrenhub-Farben und Komponenten |
| `scripts/modules.json`, `scripts/styles.json` | Reihenfolge für die Einbettung beim Build |
| `tests/schichtplan.test.cjs` | Fachlogik, Exporte, Sicherheit und Darstellungsprüfungen |
| `tests/controller.test.cjs` | Ereignis- und Integrationsprüfungen des tatsächlichen HTML-Bundles mit DOM-Nachbildung |

`src/app.js` delegiert lediglich die Ereignisse an das Feature. `src/views.js` verbindet die neue Route. Navigation und Startseite verlinken den Bereich. Redaktionelle Daten bleiben in `data/` und wurden nicht verändert. Die ursprüngliche CSS-Datei, Icons und Vorlage sind unverändert.

## Prüfstand und noch nötiger Gerätetest

`npm test` baut neu und prüft sowohl die bisherigen Funktionen als auch den Schichtplaner. Zum Zeitpunkt dieser Übergabe: **71 Tests erfolgreich**, darunter 32 variierte Team-Szenarien innerhalb eines Solver-Tests. Es wurden keine echten Personenlisten verwendet.

Geprüft: Überlappungen, knappe Besetzung, Sperrzeiten, ungleiche Schichtlängen, exakte und maximale Vorgaben, Fixierungen, fehlerhafte Imports, Text-Escaping, CSV-Formelpräfixe, Plan-/Merkliste-Speichertrennung, blockierter Browserspeicher, Routen und Build.

**Noch nicht visuell auf einem echten Browser oder Smartphone geprüft.** In dieser Umgebung war kein unterstützter Browser-Testzugang verfügbar. Die DOM-Nachbildung prüft Ereignisse, aber keine reale Layoutberechnung, Pointer-/Touch-Interaktionen oder Druckpaginierung.

Vor dem ersten Einsatz am Laptop prüfen:

1. Neues Ereignis ohne Beispiel anlegen, einschließlich Nacht-Schicht mit Ende am Folgetag.
2. Team eintragen; Bereiche und Zeiten aus-/einschalten; Plan erzeugen.
3. Eine Zuteilung fixieren, neu berechnen, manuell ändern.
4. Absichtlich zu wenig Personal eintragen und die Warnungen prüfen.
5. Projekt sichern, neu öffnen und die gleiche Besetzung wiederfinden.
6. Browser neu laden; Merkliste und Schichtplan müssen erhalten bleiben, wenn Speicherung erlaubt ist.
7. Auf einem schmalen Bildschirm alle fünf Schritte und die horizontal scrollbare Schichtentabelle bedienen.
8. Druckvorschau / PDF auf Lesbarkeit, vollständige Seiten und Umbrüche prüfen; CSV in eurem Tabellenprogramm öffnen.

## Spätere Erweiterungen

Mindestpausen, maximale Stunden am Tag, Wunschpartner, getrennte Pflicht-/Wunschregeln, stärkere Optimierung, mehrere gespeicherte Events und ein Web Worker für große Fälle können auf diesem Modul aufbauen. Online-Freigaben und gemeinsame Bearbeitung sind ein separates Backend-Vorhaben.
