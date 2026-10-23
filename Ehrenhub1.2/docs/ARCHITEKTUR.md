# Ehrenhub: Wo gehört welche Änderung hin?

Technischer Stand: 22. Oktober 2026, Wiki-Update 0.3.0. Das sichtbare Design und der bisherige Demo-Datenbestand bleiben erhalten. Es gibt weiterhin keine Anmeldung, kein Backend und keine zusätzlichen npm-Abhängigkeiten.

Ergänzung: Der Schichtplaner ist ein eigenständiges Feature unter `src/features/schichtplan/`. Die bestehende Aufteilung bleibt erhalten; komplexere Werkzeuge können ihre eigene Fachlogik, Darstellung, Bedienung und CSS zusammenhalten. Details stehen in [SCHICHTPLAN.md](SCHICHTPLAN.md).

## Die fünf Zuständigkeiten

| Zuständigkeit | Ort | Beispiele |
| --- | --- | --- |
| Redaktionelle Inhalte und Kataloge | `data/wiki/**/*.json`, `data/*.json` | Einzelartikel, Kursdetails, Förderwege, Quellen, SOS-Texte |
| Gemeinsame Darstellung | `src/components/` | Karten, Quellenlinks, Lesezeichen, Navigation, Dialoge |
| Darstellung eines Bereichs | `src/pages/` | Wiki, Antragsfinder, Fortbildungen, SOS, Suche, Merkliste |
| Verhalten und Fachlogik | `src/core.js`, `src/app.js`, `src/services/` | Suche, Filter, Routing, Klicks, lokale Speicherung |
| Veröffentlichung und Prüfungen | `scripts/`, `tests/` | Inhalt prüfen, HTML bauen, Regressionen testen |

`src/styles.css` enthält die gemeinsamen Gestaltungsvorgaben und die bisherigen Seitenregeln. `src/features/schichtplan/styles.css` ergänzt nur das neue Werkzeug sowie den Platz für den zusätzlichen Navigationslink. Beide werden über `scripts/styles.json` eingebunden. `src/icons.js` enthält die bestehenden Icons, das Markenzeichen und Hubi. `src/template.html` bleibt das HTML-Grundgerüst. Die drei ursprünglichen Dateien wurden nicht verändert.

## Was passiert bei einem Build?

1. `src/content.js` liest die JSON-Dateien und setzt daraus ein gemeinsames Datenobjekt zusammen. `scripts/load-wiki.cjs` findet die Einzelartikel rekursiv in `data/wiki/`, lässt Vorlage und Entwürfe aus und berücksichtigt die Reihenfolge aus `data/wiki.json`.
2. `scripts/validate-content.mjs` und `scripts/validate-wiki.cjs` prüfen Pflichtfelder, IDs, Verweise, Datumswerte, Quellen, Finder-Konfiguration, Hubi-Nachrichten und alle interaktiven Bausteine. Fehler stoppen den Build mit Datei/Feld als Hinweis.
3. `scripts/build.mjs` bettet dieses Objekt und die in `scripts/modules.json` aufgelisteten Module in die HTML-Vorlage ein.
   Die CSS-Dateien aus `scripts/styles.json` werden ebenfalls in dieser Reihenfolge eingebettet.
4. Es entstehen `dist/index.html` für GitHub Pages und `Ehrenhub.html` für das lokale Öffnen.

Beide Dateien enthalten dieselbe Website. Es gibt kein Nachladen der JSON-Dateien im Browser. Deshalb funktioniert die HTML-Datei weiterhin per Doppelklick und offline. Externe Anbieterlinks brauchen natürlich Internet.

Die getrennten Quelldateien sind für die Menschen, die an Ehrenhub arbeiten. Dass die Veröffentlichung weiterhin aus einer einzigen HTML-Datei besteht, widerspricht der modularen Entwicklung nicht.

## Was macht welche JavaScript-Datei?

| Datei oder Ordner | Rolle |
| --- | --- |
| `src/content.js` | Zentraler Adapter zwischen JSON-Inhalten, Build und Tests |
| `src/core.js` | Suchindex, Filter, Förderzuordnung, Route-Parser und Text-Escaping; keine DOM-Zugriffe |
| `src/components/ui.js` | Kleine gemeinsame HTML-Bausteine |
| `src/components/cards.js` | Artikel- und Kurskarten |
| `src/components/layout.js` | Navigation, Footer, Informationsdialoge und Hubis Darstellung |
| `src/pages/home.js` | Startseite mit automatisch berechneten Inhaltszahlen |
| `src/pages/wiki.js` | Wiki-Liste und Artikel-Detailansichten |
| `src/features/wiki/model.js` | Reine Zustandsübergänge der sechs Bausteine und Hubi-Fallbacks |
| `src/features/wiki/view.js` | Maskierte HTML-Ausgaben der Bausteine |
| `src/features/wiki/controller.js` | Delegierte Klicks, Fokus und Zustand im aktuellen Tab |
| `src/features/wiki/styles.css` | Ergänzungen im bisherigen Design, Mobil-, Druck- und Reduced-Motion-Regeln |
| `src/pages/training.js` | Fortbildungsfinder und Kursdetails |
| `src/pages/grants.js` | Dreistufiger Antragsfinder und Förderwegdetails |
| `src/pages/sos.js` | Darstellung der SOS-Daten und Situationsauswahl |
| `src/pages/search.js` | Gemeinsame Suchergebnisdarstellung und Suchseite |
| `src/pages/saved.js` | Merkliste |
| `src/pages/not-found.js` | Interne Nicht-gefunden-Ansicht |
| `src/views.js` | Ordnet Routen den Seiten zu; stabile Schnittstelle für den Controller |
| `src/services/storage.js` | Optionaler Browser-Speicher mit Fehlerbehandlung |
| `src/app.js` | Klicks, Tastatur, Navigation, Dialoge, Hubis Verhalten und Aktualisierung der Ansicht |

Die Module sind bewusst einfache JavaScript-Dateien statt eines neuen Frameworks. Der Build lädt sie in festgelegter Reihenfolge; sie teilen den Namensraum `EH`. Ein späterer Wechsel auf ES-Module oder ein Framework ist möglich, aber für dieses Aufräumen nicht nötig.

## Erweiterungen ohne Umweg

**Weiteren Artikel aufnehmen:** Vorlage aus `data/wiki/` in einen Themenordner kopieren und anpassen. Aktive Artikel werden automatisch gefunden. **Weiteren Kurs aufnehmen:** den bisherigen Kurskatalog ergänzen. Listen, Suche, Details und Zähler nutzen die Daten automatisch. Ausgewählte Startseitenkarten werden ausdrücklich über IDs in `data/site.json` bestimmt, nicht über eine zufällige Position im Array.

**Eine Kartenart anders gestalten:** Die entsprechende Funktion in `src/components/cards.js` und gegebenenfalls CSS anpassen. Alle Verwendungen teilen diese Komponente.

**Neuen Bereich hinzufügen:** Eigenen Datenkatalog und eine Seitendatei anlegen; Adapter, Validierung, Modulreihenfolge, Routing und Navigation erweitern. Suchindex und Tests ergänzen, wenn der neue Bereich durchsuchbar sein soll. Die aktuelle Architektur ist modular, aber kein automatisch konfigurierbares Plugin-System.

**Später CMS oder Crawler:** Diese können künftig nach Prüfung Inhalte im vereinbarten JSON-Format liefern. Ein Abruf, eine redaktionelle Freigabe oder ein Datenbankzugriff muss dafür separat entwickelt werden. Die vorhandene Trennung ist eine Grundlage, kein bereits implementierter Crawler.

**Später Benutzerkonten:** Authentifizierung, Rechte, serverseitige Datenhaltung und Datenschutz sind ein eigenes Vorhaben. Die aktuelle Merkliste ist ausschließlich lokal und kein Benutzerkonto.

## Bewusst unverändert

Wiki-Aufgaben haben nur flüchtigen Tab-Zustand. Checklisten behalten die bisherigen Speicherkennungen; neue Abschnitte/Punkte können stabile IDs verwenden. Hubi nutzt redaktionelle Ereignistexte, keine KI-Schnittstelle. Das neue Feature-CSS wird zusätzlich über `scripts/styles.json` gebündelt. Grundlagen und Schichtplan-CSS bleiben unverändert.

- Der Repository-Unterordner `Ehrenhub/` bleibt bestehen. Die lokale Arbeitskopie kann anders heißen; entscheidend ist der bestehende GitHub-Pfad.
- Build-Befehl: `npm run build`; Pages-Uploadpfad: `Ehrenhub/dist`.
- Hash-Links wie `#/wiki/juleica` benötigen keine neue Server-Konfiguration.
- Artikel- und Kurs-IDs sowie das Speicherpräfix `ehrenhub.v1.` bleiben gleich. Auf derselben Website-Adresse bleiben vorhandene Browser-Daten nutzbar.
- Alle bisherigen Beispielinhalte und Demo-Hinweise bleiben erhalten. Das Refactoring stellt keine fachliche Freigabe dar.

## Kleine Änderungen sicher machen

1. Eine überschaubare Änderung vornehmen.
2. `npm test` im Projektordner ausführen. Das baut die Website zuerst neu.
3. Die erzeugte HTML-Datei öffnen und die betroffene Bedienung selbst prüfen.
4. Änderungen als Commit speichern.
5. Erst den getesteten Stand auf `main` übernehmen; der bestehende Pages-Workflow veröffentlicht ihn.

Es wurden keine Änderungen am GitHub-Repository oder am Workflow vorgenommen. Diese Übergabe ist eine lokale, aktualisierte Arbeitskopie.
