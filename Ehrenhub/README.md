# Ehrenhub – lokaler Prototyp

Eine erste, eigenständige Webanwendung für Wissen und Orientierung in der Kinder- und Jugendarbeit. Tiefgrünes, helles Design; keine Anmeldung; keine Veröffentlichung.

## Direkt öffnen

**`Ehrenhub.html` herunterladen und per Doppelklick in einem aktuellen Browser öffnen.** Es ist keine Installation nötig. Die Datei enthält die komplette Oberfläche, Texte, Illustrationen und Logik.

Das Wiki, die Suchfunktionen, die Filter, die Detailseiten und Hubi funktionieren offline. Nur externe Informations- und Beratungslinks benötigen Internet. Auf manchen Mobilgeräten oder in Dateivorschauen wird JavaScript blockiert: Die Datei dann ausdrücklich in einem Browser öffnen.

## Was funktioniert?

- **Startseite:** vier Einstiege, direkte Suchfunktion, ausgewählte Artikel und Kursbeispiele.
- **Wiki & How-tos:** zwölf Artikel, Themenfilter, Textsuche, Detailseiten, Inhaltsnavigation, Leseindikator, Druckansicht und abhakbare Checklisten.
- **Antragsfinder:** drei Schritte für Region, Vorhaben und Stand; acht Beispielwege für vier Vorhaben in München-Stadt und im Landkreis München; unterschiedliche nächste Hinweise je Projektstand; Links zu offiziellen KJR-Informationen.
- **Fortbildungsfinder:** sieben Beispielangebote mit Filtern für Thema, Dauer und Format, Suche nach Anbieter oder Begriff, Sortierung und Detailseiten.
- **PSG & SOS:** drei auswählbare Situationen, reale Beratungslinks, Notruflinks, aufklappbare Fragen und eine Schaltfläche zum Verlassen der Seite. Kein Kontakt- oder Meldeformular.
- **Globale Suche:** oben über die Lupe, mit Strg/⌘ + K oder mit `/` außerhalb eines Eingabefelds. Pfeiltasten navigieren im Suchdialog, Enter öffnet einen Treffer bzw. die gesamte Suche.
- **Merkliste:** Artikel, Kursbeispiele und Förderwege lokal speichern und als Textdatei herunterladen.
- **Hubi:** Hund unten rechts anklicken. Er wedelt, freut sich und reagiert auf mehrere Streicheleinheiten. Über das kleine Kreuz kann er pausieren; im Footer kommt er zurück. Auf der SOS-Seite bleibt er ausgeblendet.
- **Lokale Daten:** Merkliste, Häkchen, Beispiel-Feedback und Hubis Ruhemodus bleiben im Browser. Unter „Lokale Daten“ lassen sie sich zurücksetzen.

## Was ist ein Beispiel?

Die Wiki-Texte sind nicht fachlich freigegeben. Alle Kurstermine und die dargestellten Kursdetails sind Beispiele. Die Ergebnisse des Antragsfinders sind illustrative Recherchewege und keine Prüfung einer Förderberechtigung. Es gibt keine echten Anmeldungen, Anträge oder Zusagen.

Die externen Links führen zu öffentlich zugänglichen Informationsseiten. Ihre Aufnahme behauptet keine Kooperation mit den genannten Organisationen. Auf der SOS-Seite werden keine erfundenen Telefonnummern oder Beratungsstellen verwendet. Die Zusammenstellung ersetzt keine Fachberatung.

## Lokal gespeicherte Daten

Es gibt keinen Backend-Server, keine Benutzerkonten, kein Tracking, keine Cookies und keine eingebetteten externen Fonts oder Bibliotheken. Die optionalen lokalen Einstellungen verwenden `localStorage` unter dem Präfix `ehrenhub.v1.`.

Ob ein Browser `localStorage` für eine direkt geöffnete HTML-Datei dauerhaft zulässt, unterscheidet sich. Wird die Speicherung blockiert, bleiben die Interaktionen für die laufende Sitzung nutzbar und die Anwendung zeigt einen Hinweis. Im privaten Browsermodus können die Einstellungen beim Schließen verschwinden. Das Verschieben oder Umbenennen der HTML-Datei kann eine andere lokale Ablage bedeuten.

Suchbegriffe können als Teil der lokalen URL im Browserverlauf stehen. „Seite verlassen“ führt zur Startseite; die Schaltfläche löscht keinen gesamten Browserverlauf. Externe Anbieter haben eigene Datenschutzbedingungen.

## Weiterentwickeln

Für die Entwicklung reicht **Node.js ab Version 18**. Es sind keine npm-Abhängigkeiten nötig.

```bash
node scripts/build.mjs
node --test tests/core.test.cjs tests/views.test.cjs
```

Der Build erstellt `Ehrenhub.html` und `dist/index.html`. Die Datei unter `src/template.html` ist die Vorlage, keine direkt lauffähige Version.

| Datei | Aufgabe |
| --- | --- |
| `src/content.js` | Artikel, Kursbeispiele, Förderwege, Kategorien und Quellen |
| `src/core.js` | Routing, Suche, Kursfilter, Förderzuordnung und Validierung |
| `src/views.js` | Ansichten für die einzelnen Bereiche und wiederverwendbare Karten |
| `src/app.js` | Navigation, Klicks, Tastaturbedienung, lokale Speicherung und Hubi |
| `src/icons.js` | Kleine SVG-Icons, Markenform und Hund |
| `src/styles.css` | Farben, Typografie, Komponenten, responsive Regeln und Druckansicht |
| `src/template.html` | HTML-Grundgerüst und Dialoge |
| `scripts/build.mjs` | Bündelt alles zu einer eigenständigen HTML-Datei |
| `tests/` | Automatisierte Prüfungen ohne Browser |

### Inhalte ersetzen

Neue Artikel, Kursangebote und Förderwege können über die Datenobjekte in `src/content.js` ergänzt werden. Die Listen, Suche und bestehenden Filter verwenden diese Daten. IDs sollten stabil und eindeutig bleiben, damit Links und lokale Lesezeichen weiter funktionieren. Statische Startseitenzahlen und Kurztexte müssen bei größeren Inhaltsänderungen mit aktualisiert werden.

### Einen weiteren Bereich ergänzen

Für ein neues Modul eine eigene Datenstruktur und Ansichts-Funktion anlegen, den Routennamen in `core.js` freigeben und in `views.js` Navigation, Startseitenkarte und Renderer ergänzen. Wenn es durchsuchbar sein soll, den Suchindex in `core.js` erweitern. Neue Interaktionen werden über `data-*`-Attribute an den zentralen Controller angebunden. Ein späteres Backend kann die Inhalte liefern, ohne dass Suchlogik und Gestaltung komplett neu entstehen müssen.

Die Architektur ist bewusst ein schlanker Prototyp. Redaktionsfreigaben, CMS, echte Zuschussregeln, Benutzerkonten, organisationsbezogene Rechte und gemeinsame Inhalte sind noch nicht implementiert.

## Prüfstand

Stand: 18. Oktober 2026.

- 20 automatisierte Tests erfolgreich: Suchverhalten, kombinierte Filter, alle 24 Kombinationen aus Region/Vorhaben/Stand, ungültige URLs, gespeicherte Merkliste, sichere Darstellung von Suchbegriffen und Erreichbarkeit interner Links.
- Alle JavaScript-Dateien auf Syntax geprüft.
- 34 gerenderte Seitenstrukturen geprüft: keine doppelten IDs, unbeschrifteten Bedienelemente oder verschachtelten Links/Buttons; externe neue Tabs sind abgesichert.
- Vollständig eigenständiger Build ohne externe Laufzeit-Assets.

**Noch nicht geprüft:** tatsächliche Browser-Klicks, Darstellung auf realen Geräten, Druckergebnis und Verhalten mit Screenreadern. Die vorgesehene Browser-Steuerung war in der Erstellungsumgebung nicht verfügbar. Die Prüfungen oben sind Logik- und Strukturtests, keine Browser-Tests.

Ein guter gemeinsamer Probelauf: einen Artikel finden und abhaken; den Antragsfinder einmal für Stadt und einmal für Landkreis durchgehen; einen Online-Präventionskurs filtern; drei Inhalte merken; Datei neu öffnen; die SOS-Situationen wechseln; Hubi streicheln. Danach können wir gezielt Design und Abläufe überarbeiten.
