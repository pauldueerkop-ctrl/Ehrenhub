# Ehrenhub – modularer Web-Prototyp

Wissen und Orientierung für die Kinder- und Jugendarbeit in München. Tiefgrünes Design, keine Anmeldung, keine externen Laufzeit-Abhängigkeiten. Diese Version räumt den vorhandenen Prototyp technisch auf, ohne seine Gestaltung und Beispielinhalte zu ersetzen.

## Direkt ansehen

Die erzeugte Datei **`Ehrenhub.html` im Browser öffnen**. Im Übergabepaket liegt sie bereits bei. Nach Änderungen an den Quelldateien muss sie neu gebaut werden.

Die eigenständige HTML-Datei enthält Daten, Gestaltung und Logik. Suche, Filter, Detailseiten, Checklisten, Merkliste und Hubi funktionieren ohne Backend. Externe Anbieterlinks brauchen Internet.

## Entwickeln und prüfen

Node.js ab Version 18 und npm reichen. Es ist kein `npm install` nötig.

Im Projektordner mit der `package.json`:

```bash
npm run build
npm test
```

- `npm run build` prüft Inhalte und erzeugt `Ehrenhub.html` sowie `dist/index.html`.
- `npm test` baut zuerst neu und führt danach alle automatisierten Tests aus.
- `npm run validate` prüft nur den Datenbestand.
- `npm run check` ist eine Kurzform für Build und Tests.

## Welche Datei ändern?

| Gewünschte Änderung | Zuständiger Ort |
| --- | --- |
| Artikel, Kurse, Antragswege, Quellen oder SOS-Inhalte | `data/` |
| Auswahl hervorgehobener Startseiten-Einträge | `data/site.json` |
| Gemeinsame Karten, Navigation, Dialoge | `src/components/` |
| Aufbau eines bestimmten Bereichs | `src/pages/` |
| Farben, Schriften, Abstände, Hover- und Mobilverhalten | `src/styles.css` |
| Suche, Filter und Förderzuordnung | `src/core.js` |
| Klicks, Dialoge und Navigation | `src/app.js` |
| Lokale Browser-Speicherung | `src/services/storage.js` |
| Build und Inhaltsprüfung | `scripts/` |
| Funktionstests | `tests/` |

Daten werden beim Build eingebettet, nicht per `fetch` nachgeladen. Die modularen Quelldateien werden zur Veröffentlichung weiterhin zu einer einzigen HTML-Datei gebündelt. Bedienbeschriftungen bleiben in der Darstellung; redaktionelle Inhalte und Kataloge stehen separat in JSON.

## GitHub Pages: bisherige Konfiguration beibehalten

Im bestehenden Repository liegt dieses Projekt unter **`Ehrenhub/`**. Diesen Ordner nicht entfernen oder erneut ineinander verschachteln.

Der bereits funktionierende Workflow bleibt unverändert:

- Build-Arbeitsverzeichnis: `Ehrenhub`
- Build-Befehl: `npm run build`
- hochzuladender Pages-Ordner: `Ehrenhub/dist`

Der Build erzeugt dort die erforderliche `index.html`. Hash-Links wie `#/wiki/juleica` funktionieren weiterhin ohne zusätzliche Serverregeln.

Der neue Build enthält bereits die Inhaltsvalidierung. Optional kann später der Build-Schritt im bestehenden Workflow auf `npm test` geändert werden, um vor jeder Veröffentlichung zusätzlich alle Tests auszuführen. Nicht nötig, um dieses Update einzuspielen; keinen zweiten Deploy-Workflow anlegen.

`.gitignore` schließt generierte Dateien, lokale Abhängigkeiten und typische Geheimnisdateien aus. Schon zuvor eingecheckte Dateien werden dadurch nicht automatisch aus Git entfernt. Auch bei privaten Projekten keine Passwörter oder API-Schlüssel in Quellcode oder JSON ablegen.

## Was bleibt erhalten?

- Vier Hauptbereiche: Wiki & How-tos, Antragsfinder, Fortbildungen sowie PSG & SOS.
- Bisherige Artikel-, Kurs- und Förderweg-IDs, Verknüpfungen und Beispielinhalte.
- Globale Suche, Filter, Merkliste, Checklisten, lokale Rückmeldung, Druckfunktion und Hubi.
- Design, Icons, Responsive-Regeln und HTML-Grundgerüst.
- Das Speicherpräfix `ehrenhub.v1.`; vorhandene lokale Daten bleiben unter derselben Website-Adresse nutzbar.

Es gibt weiterhin keine Benutzerkonten, keine zentrale Datenbank, keinen Crawler und keine geteilten Daten. GitHub Pages stellt die erzeugten statischen Dateien bereit. Das Projekt bindet keine externen Fonts, Analyse-Skripte oder Bibliotheken ein.

## Inhaltlicher Status

Wiki-Texte sind nicht fachlich freigegeben. Kurstermine und Kursdetails sind Beispiele; der Antragsfinder zeigt illustrative Recherchewege, keine Förderberechtigungen. Die verlinkten Organisationen sind keine behaupteten Kooperationspartner.

Das Aufräumen ist keine fachliche, datenschutzrechtliche oder rechtliche Freigabe für einen regulären öffentlichen Betrieb. Die alten lokalen Demo-Texte wurden bewusst nicht inhaltlich überarbeitet.

## Weitere Anleitungen

- [Architektur und Erweiterungen](docs/ARCHITEKTUR.md)
- [Inhalte pflegen](docs/INHALTE-PFLEGEN.md)
- [Prüfprotokoll und verbleibende manuelle Tests](docs/PRUEFPROTOKOLL.md)
- [Bisherige externe Quellen](SOURCES.md)

Prüfstand: 40 automatisierte Tests erfolgreich. 282 gerenderte Ausgaben mit dem ursprünglichen Prototyp verglichen; CSS, Icons und HTML-Vorlage unverändert. Die Tests enthalten Logik-, Struktur- und Controller-Prüfungen mit DOM-Nachbildung, aber keinen echten Browser- oder Mobilgeräte-Test.
