# Grafischer Stundenplan-Export

Dieses Update ersetzt nur die bisherige tabellarische PDF-/Druckansicht. CSV, Projektdateien, gespeicherte Pläne und Berechnungsalgorithmus bleiben kompatibel. Keine neuen Dienste, Bibliotheken oder laufenden Kosten.

## Benutzung

1. Im Schichtplaner einen Plan erzeugen oder eine vorhandene Projektdatei öffnen.
2. Im Schritt **Dein Plan** auf **PDF-Stundenplan** klicken.
3. Die Exportseiten mit **Vorherige Seite / Nächste Seite** ansehen.
4. Bei Bedarf die Anzahl der Arbeitsbereiche und die maximale Zeitspanne je Seite ändern. Die persönliche Übersicht lässt sich an- oder abwählen.
5. **Drucken / PDF speichern** anklicken. Im Browser A4 quer, Skalierung 100 %, Kopf-/Fußzeilen aus und bei Bedarf Hintergrundgrafiken an wählen. Falls der Browser eigene Ränder ergänzt, „Keine“ auswählen; die Seitengrafik enthält bereits Innenränder. Ziel: **Als PDF speichern**.

CSV bleibt als eigener, unveränderter Knopf direkt daneben. Das PDF ist für Aushang und Teilen; CSV ist für Excel, LibreOffice und Weiterverarbeitung. Eine CSV-Datei enthält grundsätzlich keine grafische Gestaltung.

## Was die Aufteilung macht

| Situation | Darstellung |
| --- | --- |
| Normaler Plan | Zeitachse links, Arbeitsbereiche oben, Namen in farbigen Schichtblöcken |
| Viele Bereiche | Mehrere Seiten mit jeweils bis zu 3, 4 oder 5 Spalten; Kopfzeile zeigt die Bereichsgruppe |
| Lange Veranstaltung | Maximal 4, 6 oder 8 Stunden pro Seite; tatsächliche Umbrüche können früher liegen |
| Ende nach Mitternacht | Getrennte Tagesseiten mit Datum; Tagesende als 24:00, Folgetag ab 00:00 |
| Schicht läuft auf Folgeseite weiter | `<` bzw. `>` an der Uhrzeit und derselbe Name auf beiden Teilblöcken |
| Sehr kurze oder dicht gestaffelte Schichten | Zeitraster wird für lesbare Namen gestreckt und bei Bedarf früher umgebrochen |
| Gleichzeitige Schichten im selben Bereich | Zusätzliche, eindeutig bezeichnete Parallelspalten; sie zählen zum Spaltenlimit |
| Sehr großes Team oder sehr lange Namen | Kurzer Hinweis „Team T01“ im Block und vollständige Namen auf einer Detailseite |
| Noch freie Plätze | Orange Blöcke mit `OFFEN`; Entwurfskennzeichnung auf jeder Seite |
| Persönliche Übersicht aktiviert | Zusätzliche Karten pro Person mit Schichten und Gesamtbelastung |

Die angegebenen Uhrzeiten sind verbindlich; Blockhöhen sind bei dichten Plänen nicht zwingend proportional zur Dauer. Jeder Schichtzeitraum wird vollständig abgedeckt. Weder der Bildschirmfilter noch eine ausgeschaltete persönliche Übersicht dürfen Namen aus dem Gesamtexport verschwinden lassen. Notwendige Teamdetails bleiben deshalb immer erhalten.

## Technischer Aufbau

- `src/features/schichtplan/print.js` berechnet die Seiten ohne DOM oder Netzwerk. `build(project, options)` liefert ein Seitenmodell; `svgPage(document, index)` zeichnet daraus eine eigenständige SVG-Seite.
- Dieselben Grafiken werden in der Vorschau und im versteckten Druckbereich verwendet. Sie bleiben beim PDF-Druck Vektorgrafiken, soweit der Browser das unterstützt.
- Die benannte CSS-Druckseite `ehrenhub-shift` verwendet A4 quer mit eingebauten Innenrändern. Andere Ehrenhub-Seiten behalten ihre bisherigen Druckregeln.
- `view.js` enthält die Vorschau-Oberfläche, `controller.js` verarbeitet ihre Einstellungen und ruft `window.print()` auf.
- Die Druckoptionen gelten nur für die aktuelle Sitzung. Die gespeicherte Projektstruktur wird nicht verändert. Nach einem Neuladen gelten wieder vier Spalten, sechs Stunden und persönliche Übersicht an.
- `model.js` und `solver.js` sind gegenüber dem vorherigen Schichtplan-Update bytegleich. CSV-Felder, Trennzeichen, UTF-8-BOM und Schutz vor Formel-Präfixen sind unverändert.

## Grenzen und Prüfung

Der grafische Export begrenzt sich auf höchstens 160 Seiten und 62 belegte Kalendertage; einzelne Schichten dürfen höchstens 31 Tage umfassen. Extrem lange Überschriften können eine Kürzung erfordern. Bei Überschreitung gibt es eine verständliche Fehlermeldung; der CSV-Export bleibt verfügbar.

Automatisiert geprüft: Optionen, Seitenzahlen, geometrische Grenzen, Überschneidungen, exakte Abdeckung aller Schichten, Mitternacht, unregelmäßige Zeiten, dichte Schichten, große Teams, lange Namen, fortgesetzte Personenkarten, Text-Escaping, Entwurfskennzeichnung, Vorschauaktionen und unveränderte Projektdaten/CSV.

Das Beispiel-PDF im Updatepaket wurde aus denselben SVG-Grafiken mit einem lokalen Referenzrenderer erzeugt. Es zeigt das geplante Layout, ersetzt aber keinen Test des konkreten Browser-Druckdialogs. Die Website benötigt diesen Referenzrenderer nicht. Bitte im eigenen Browser prüfen, dass eine Vorschauseite genau einer PDF-Seite entspricht und keine zusätzliche leere Seite entsteht.

PDF und CSV enthalten Namen. Nur gezielt teilen und keine echten Einsatzpläne in das öffentliche GitHub-Repository hochladen.
