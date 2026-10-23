# Prüfprotokoll – Struktur-Refactoring

Historisches Protokoll des ersten Refactorings. Der aktuelle Prüfstand für die Wiki-Redaktion steht in [WIKI-UPDATE-PRUEFUNG.md](WIKI-UPDATE-PRUEFUNG.md).

Stand: 18. Oktober 2026. Bezugsstand ist der vorhandene lokale Ehrenhub-Prototyp 0.1.0. Die technische Projektversion ist jetzt 0.2.0; sichtbare Demo-Texte und ihre Versionsangabe wurden nicht redaktionell überarbeitet.

## Automatisierte Prüfungen

`npm test`: **40 Tests erfolgreich**. Der Befehl baut die Website vor den Tests neu.

Abgedeckt sind:

- die bisherigen Such-, Filter-, Routing- und Darstellungsprüfungen;
- sämtliche 24 Kombinationen der bestehenden Antragsfinder-Antworten;
- JSON-Pflichtfelder, eindeutige IDs, Quellen und interne Verweise;
- ungültige Termine, unbekannte Kategorien und unsichere URL-Schemata;
- zusätzliche Artikel und Kurse ohne Anpassung der Ansichten;
- stabile Startseitenauswahl beim Umsortieren der Daten;
- Ausgabe-Maskierung und ungültige Finder-Parameter;
- bestehende Speicherkennungen, ungültige gespeicherte Werte und blockierter Browser-Speicher;
- selektives Zurücksetzen nur der eigenen lokalen Daten;
- tatsächlicher Start des erzeugten HTML-JavaScripts in einer Node-Testumgebung;
- Ereignisbehandlung für Merkliste, Suche, Hubi und SOS-Rückkehr mit einer minimalen DOM-Nachbildung;
- reproduzierbarer Build aus einem anderen Arbeitsverzeichnis;
- vollständige eigenständige HTML-Ausgabe ohne zusätzlich benötigte Laufzeitdateien.

## Vergleich mit dem unveränderten Ausgangsstand

- Die fünf bisherigen Datenkataloge sowie Datum und Demo-Version sind inhaltlich identisch.
- `src/styles.css`, `src/icons.js` und `src/template.html` sind bytegenau unverändert.
- **282 Ausgaben** von Seiten, Navigation, Dialogen und Zuständen wurden mit dem Ausgangsstand verglichen. Sie stimmen nach Vereinheitlichung gleichwertiger Text-Escapes überein.
- Der Vergleich umfasst die vorhandenen Detailseiten, gefilterte Ansichten, alle Förderkombinationen, leere und gefüllte Merklisten, Checklisten-/Feedback-Zustände, SOS-Tabs, Finder-Schritte und Hubi.
- Ausgabe weiterhin: `Ehrenhub.html` und `dist/index.html`, identischer Inhalt.

Dieser einmalige Vorher-nachher-Vergleich wurde außerhalb des ausgelieferten Projekts gegen die gesicherte Originalkopie ausgeführt. Er ist bewusst kein festgeschriebener Inhaltssnapshot in der Testsuite: spätere redaktionelle Änderungen sollen möglich bleiben.

## Grenzen der Prüfung

Kein echter Browser-Klicktest, keine Screenshot-Abnahme, kein Test auf realen Mobilgeräten oder mit Screenreadern. Die dafür vorgesehene Browser-Testumgebung war hier nicht verfügbar. Die Controller-Tests verwenden eine vereinfachte DOM-Nachbildung und prüfen weder Layout noch vollständiges Browserverhalten.

Externe Anbieterlinks, rechtliche Texte und Fachinhalte wurden in diesem Auftrag nicht neu recherchiert oder freigegeben. Das Projekt bleibt ein Prototyp.

Kein Commit, Push oder Deployment in Pauls GitHub-Repository wurde vorgenommen. Der aktualisierte Stand muss dort noch übernommen werden.

## Empfohlener kurzer manueller Test nach dem Update

1. Startseite und Handyansicht ansehen.
2. Nach Juleica suchen und einen Artikel öffnen.
3. Einen Artikel merken, ein Häkchen setzen und die Seite neu laden.
4. Einen Online-Präventionskurs filtern.
5. Antragsfinder für Stadt und Landkreis durchgehen.
6. SOS-Tabs und „Seite verlassen“ testen; Hubi bleibt auf SOS ausgeblendet.
7. Einen Detail-Link direkt öffnen und neu laden.
