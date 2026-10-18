# Inhalte pflegen, ohne die Darstellung anzufassen

## Zuständige Dateien

| Datei | Inhalt |
| --- | --- |
| `data/wiki.json` | Artikel, Abschnitte, Checklisten und verwandte Artikel |
| `data/fortbildungen.json` | Kursangebote mit Termin, Anbieter und Filtermerkmalen |
| `data/antraege.json` | Die acht bisherigen beispielhaften Förderwege |
| `data/quellen.json` | Externe Quellen mit Kurzkennung, Bezeichnung und URL |
| `data/kategorien.json` | Wiki-Themen, Farben und Icons |
| `data/finder.json` | Themen, Regionen, Projekttypen, Kursdauern, Finder-Fragen und Hinweise |
| `data/sos.json` | Situationen, Beratungsverweise und häufige Fragen |
| `data/site.json` | Startseitenbereiche, hervorgehobene Einträge, Suchvorschläge und Demo-Metadaten |

Bedienoberflächen-Texte wie „Merken“, „Suche“ und Schaltflächenbeschriftungen bleiben bei der Darstellung. Redaktionelle Artikel, Angebote, Beratungsverweise und Kataloge stehen in JSON. Das ist keine vollständige Mehrsprachigkeits-Lösung.

## Einen Artikel hinzufügen

Einen vorhandenen Eintrag in `data/wiki.json` kopieren und anpassen. Ein kleines gültiges Beispiel:

```json
{
  "id": "material-checkliste",
  "title": "Material für die nächste Gruppenstunde",
  "summary": "Ein neuer Beispielartikel zum Ausprobieren.",
  "category": "gruppenalltag",
  "icon": "layers",
  "color": "lavender",
  "minutes": 3,
  "tags": ["Material", "Gruppenstunde"],
  "sections": [
    {
      "title": "Vorher gemeinsam sammeln",
      "text": "Dieser Text ist ein bewusst einfacher Demo-Inhalt.",
      "checklist": ["Benötigtes Material gesammelt", "Transport geklärt"]
    }
  ],
  "related": ["erste-gruppenstunde"]
}
```

Der Eintrag gehört als weiteres Objekt in das äußere Array, mit einem Komma zum vorherigen Eintrag. Keine Kommentare oder Kommas nach dem letzten Feld verwenden. JSON braucht doppelte Anführungszeichen.

Die neue Detailseite erhält automatisch den Link `#/wiki/material-checkliste`. Listen, Suche und Artikelzähler aktualisieren sich mit dem nächsten Build. Wenn der Artikel auf der Startseite hervorgehoben werden soll, seine ID unter `featuredArticles` in `data/site.json` eintragen.

## Wichtige Regeln

- IDs sind eindeutige, stabile Kennungen wie `erste-gruppenstunde`. Bestehende IDs nicht ohne Grund umbenennen: Links und Merkliste verweisen darauf.
- Quellen werden in `data/quellen.json` angelegt und über ihre Kennung referenziert, etwa `"source": "kjg"`.
- Nur passende HTTPS-Informationslinks verwenden. Die technische Prüfung bestätigt das Format, nicht die Erreichbarkeit oder fachliche Richtigkeit einer Quelle.
- Kursdaten haben das Format `2027-03-29`. Kategorien, Themen und Filterwerte müssen zur Konfiguration passen.
- JSON-Texte sind Klartext, kein HTML. Die Darstellung kümmert sich um die Formatierung und maskiert Texte.
- Beispiele bleiben Beispiele: Termine, Förderwege und insbesondere SOS-/Präventionsinformationen vor einem echten Einsatz fachlich prüfen. Metadaten wie `reviewed` nicht automatisch auf ein neues Datum setzen, ohne tatsächlich zu prüfen.
- Checklisten verwenden bislang Artikel-ID, Abschnittsposition und Zeilenposition als Speicherkennung. Beim späteren Umordnen vorhandener Checklisten können alte Häkchen daher zu anderen Zeilen passen. Dieses Refactoring ändert ihre Reihenfolge nicht; vor umfangreicher redaktioneller Umstrukturierung sollte ein Umstieg auf stabile Abschnitts-/Punkt-IDs geplant werden.

## Vor dem Veröffentlichen

Im Projektordner ausführen:

```bash
npm run validate
npm test
```

`validate` prüft den Datenbestand. `test` baut zusätzlich die aktuelle Website und prüft Funktionen. Auch `npm run build` führt die Inhaltsprüfung aus; der bisherige GitHub-Pages-Workflow bekommt sie daher ohne Workflow-Änderung mit.

Eine Fehlermeldung wie `data/fortbildungen.json.kjg-kurswoche.date` zeigt Datei, Eintrag und Feld. Erst den Fehler korrigieren, dann erneut bauen. Ein bestandener Test ersetzt keine fachliche Prüfung.
