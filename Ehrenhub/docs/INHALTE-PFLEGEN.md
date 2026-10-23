# Inhalte pflegen

Der Wiki-Redaktionsbereich liegt jetzt unter **`data/wiki/`**: eine JSON-Datei pro Artikel, sortiert in thematische Unterordner.

Die vollständige Anleitung, mit allen Feldern, kopierbarem Minimalartikel, den sechs interaktiven Bausteinen, Reaktionen, Hubi und Fehlerhilfe:

**[START-HIER.txt](../data/wiki/START-HIER.txt)**

Vorlage: [ARTIKEL-VORLAGE.json](../data/wiki/ARTIKEL-VORLAGE.json). Sie enthält alle unterstützten Bausteine und bleibt als `draft` aus der Website heraus. Die drei sichtbaren Demos stehen unter `data/wiki/99-funktionsbeispiele/`.

## Schnellablauf

1. Vorlage in einen Themenordner kopieren und umbenennen.
2. Gleiche `id` im Artikel eintragen; Titel, Kategorie und Inhalte anpassen.
3. Nicht benötigte Abschnitte/Bausteine entfernen.
4. `status`: `draft` während der Arbeit, `example` zum Ausprobieren, `published` nach eurer redaktionellen Freigabe.
5. `npm test` ausführen und die neu gebaute `Ehrenhub.html` öffnen.
6. Geänderte Artikeldatei hochladen; vorhandenen Pages-Workflow abwarten.

Listen, Suchindex und Unterseiten finden neue aktive Artikel automatisch. Kein Code-Eintrag und kein neuer Deploy-Workflow nötig. `data/wiki.json` enthält nur noch die bevorzugte Reihenfolge, keine Texte.

Ein Entwurf in einem öffentlichen Repository ist trotzdem öffentlich einsehbar. Keine vertraulichen Daten darin ablegen.

## Andere Inhalte bleiben am bekannten Ort

| Ort | Inhalt |
| --- | --- |
| `data/wiki/**/*.json` | Einzelne Wiki-Artikel |
| `data/hubi.json` | Allgemeine Hubi- und Seitennachrichten |
| `data/fortbildungen.json` | Beispielangebote, Anbieter und Filtermerkmale |
| `data/antraege.json` | Beispielhafte Förderwege |
| `data/quellen.json` | Externe Quellen mit Kennung, Bezeichnung und HTTPS-URL |
| `data/kategorien.json` | Sichtbare Wiki-Kategorien, Farben und Icons |
| `data/finder.json` | Filter, Fragen, Auswahlmöglichkeiten und Hinweise |
| `data/sos.json` | Situationen, Beratungsverweise und FAQ |
| `data/site.json` | Startseiten-Einträge, Suchvorschläge und Demo-Metadaten |

Quellen werden über ihre Kennung referenziert, z. B. `"source": "kjg"`. Kursdaten bleiben im Format `JJJJ-MM-TT`. Technische Validierung prüft Struktur und Referenzen, nicht Erreichbarkeit, aktuelle Fristen oder fachliche Richtigkeit.

## Prüfen

```bash
npm run validate
npm test
```

`validate` prüft Inhalte; `test` baut zuerst neu und testet die Funktionen. Schon `npm run build` stoppt bei fehlerhaften aktiven Artikeln.

Die vollständige Website entsteht als `Ehrenhub.html` und `dist/index.html`. Nicht direkt in diesen erzeugten Dateien redigieren. Ein Datei-Upload führt keine Inhalte zusammen: eigene Änderungen vor dem Ersetzen vergleichen.
