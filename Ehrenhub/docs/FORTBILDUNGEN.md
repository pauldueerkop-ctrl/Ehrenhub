# Fortbildungsweg 0.5.0

Stand: 29.10.2026. Grundlage ist das zuletzt übergebene Förderassistenten-Paket, **nicht** ein aktueller Abruf des GitHub-Repositorys. Eigene zwischenzeitliche Änderungen vor dem Hochladen vergleichen.

## Was neu ist

- Vier Einstiege: erste Juleica, Juleica verlängern, Prävention, Erste Hilfe.
- Kurze Selbsteinschätzung mit „noch offen“ statt erzwungener falscher Angaben.
- Lernweg: erledigt laut eigener Angabe, nächster Schritt oder noch zu klären.
- Passende Angebote und klare Anbieter-Verweise, falls kein bestätigter Termin vorhanden ist.
- Katalog mit Suche, Thema, Anbieter, Ort, Zeitraum, Niveau, Dauer und Format.
- Eigene Kursdetails mit Original-Link, Preis, Frist, Prüfdatum und Anerkennungsgrenzen.
- Kalendermerker (.ics): ganztägig, bekannte Uhrzeiten in der Beschreibung, keine Buchung.
- Lernweg optional lokal speichern; Dateisicherung/-import und Drucken/PDF.
- Keine Konten, kein Netzwerkabruf der Nutzerauswahl, keine Nachweis-Uploads.

Die Daten stehen unter `data/fortbildungen/`. Der neue Bereich folgt der vorhandenen Feature-Aufteilung unter `src/features/fortbildungen/`. Das bestehende Farbsystem, Icons, Hubi und Navigationskonzept werden weiterverwendet.

## Fachliche Grenze

Dies ist eine Orientierung für Bayern, keine automatische Zertifizierung. Der Träger prüft Ausbildung, Tätigkeit und Nachweise. Die Selbstangabe „erledigt“ ist keine Freigabe. Ein gemerkter oder im Kalender vorgemerkter Kurs ist weder gebucht noch abgeschlossen. Die Software addiert keine geschätzten Fortbildungsstunden.

Grundlage: [Bayerische Juleica-Standards](https://www.bjr.de/ueber-uns/gremien/beschluesse/bayerische-juleica-standards-ab-2024) und [BJR-Informationen zu Antrag/Verlängerung](https://www.bjr.de/handlungsfelder/ehrenamt/juleica).

Die Regelwerte sind in `wegweiser.json` hinterlegt. Eine eigenständige zusätzliche Präventionsschulung wird nicht fälschlich als universelle Juleica-Pflicht dargestellt; konkrete Trägeranforderungen werden getrennt behandelt. Eine weiterführende Schulung erscheint nicht als Grundlagenschulung. Erste Hilfe wird nicht pauschal auf die acht Verlängerungsstunden angerechnet.

## Einmalig recherchierter Kursbestand

| Angebot | Datum / Zeitfenster | Beitrag laut Quelle | Original |
| --- | --- | --- | --- |
| BRK EH-Ausbildung, Pasing | 06.11.2026, 08:00–15:45 | 65 € | [Kurs 18229236](https://www.erste-hilfe.brk-muenchen.de/kursanmeldung-bg/kurs/18229236) |
| BRK EH-Ausbildung, Sendling | 07.11.2026, 08:30–16:15 | 65 € | [Kurs 18321607](https://www.erste-hilfe.brk-muenchen.de/kursanmeldung-bg/kurs/18321607) |
| BRK EH-Ausbildung, Unterhaching | 14.11.2026, 08:00–15:45 | 65 € | [Kurs 18299719](https://www.erste-hilfe.brk-muenchen.de/kursanmeldung-bg/kurs/18299719) |
| BRK EH-Ausbildung, Sendling | 14.11.2026, 08:30–16:15 | 65 € | [Kurs 18305005](https://www.erste-hilfe.brk-muenchen.de/kursanmeldung-bg/kurs/18305005) |
| KjG, weiterführende Präventionsschulung | 18.11.2026, 17:00–21:30 | 5 €, KjG-Mitglieder frei | [Originalveranstaltung 10783](https://mida.kjg.de/DVMuenchenundFreising/?dialog=2&veranstaltung=10783) |

Alle Quellen wurden am **29.10.2026** abgerufen. Freie Plätze sind nicht bestätigt. Für die KjG-Schulung ist der 10.11.2026 als Anmeldeschluss angegeben. Anrechenbarkeit zur Juleica-Verlängerung steht beim Anbieter, eine anrechenbare Stundenanzahl dagegen nicht. Die BRK-Detailseiten nennen keine UE-Zahl; deshalb ist die konkrete Juleica-Eignung nicht ungeprüft zugesagt. Keine Anmeldung oder Zahlung wurde ausgelöst.

### Bewusst nicht als neue Termine ausgegeben

- KjG-Herbstkurswochen 31.10.–06.11.2026: gefundene Anmeldefristen abgelaufen, teilweise Pflichtvorwochenenden schon vorbei. Keine erfundenen Ostertermine 2027. Die [Kurswochen-Übersicht](https://muenchen.kjg.de/kurswoche/) bleibt erreichbar.
- [BDKJ Region München](https://bdkj-muenchen.de/fortbildungen/): zum Abrufzeitpunkt kein bevorstehender Termin in dieser Übersicht. Anbieterkarte bleibt sichtbar.
- Rosenheimer Präventionsgrundlagen: Widerspruch zwischen offiziellen Unterseiten (21.11. versus 23.11.2026). Kein ungeklärter Termin veröffentlicht.

Der Katalog ist bewusst klein und nicht vollständig. Es läuft **kein geplanter Crawler**, kein Abo und keine externe Datenbank.

## Redaktion

Siehe [vollständige START-HIER.txt](../data/fortbildungen/START-HIER.txt). Der Build liest veröffentlichte Dateien rekursiv. Vorlage, Entwürfe und archivierte Dateien erscheinen nicht auf der Website. Eine Entwurfsdatei in einem öffentlichen Repository ist trotzdem öffentlich einsehbar.

Neue Kurse brauchen keine Codeänderung. Neue Anbieter lassen sich in `wegweiser.json` ergänzen. Neue Themen oder eine neue fachliche Qualifikationslogik brauchen dagegen passende Modell-/UI-/Teständerungen.

## Speichern und Daten

Schlüssel: `ehrenhub.v1.learningPath`, getrennt von Schichtplan, Fördercheck und Merkliste. Speicherung ist zunächst aus. Im JSON stehen Ziel, Selbsteinschätzung und gegebenenfalls ein Kursdatum, keine Bescheinigungen, Namen oder E-Mail-Adressen. Auf gemeinsam genutzten Geräten kann ein gespeicherter Lernweg eingesehen werden. Dateiexporte nicht ins öffentliche Repository hochladen.

Eine gelöschte oder gesperrte Browserablage verhindert die Benutzung nicht; dann bleibt der Stand nur in der Sitzung. Importdateien werden auf Schema, Größe und erlaubte Felder geprüft. Veränderte Regelversionen verlangen eine erneute Sichtung der Angaben. Es gibt keine geräteübergreifende Synchronisierung.

## Kompatibilität

Alte Demo-Kurs-IDs führen zu einer Erklärung und passenden aktuellen Angeboten. Alte Kurs-Lesezeichen bleiben so auffindbar, ohne einen fiktiven Termin als echte Veranstaltung weiterzuführen. Das alte Demo-Array wird durch eine Hinweisdatei am selben Pfad ersetzt; beim GitHub-Upload ist deshalb keine Löschaktion nötig.

Der vorhandene Build und GitHub-Pages-Pfad bleiben unverändert. Die hier enthaltenen erzeugten HTML-Dateien sind lokale Vorschauen. GitHub muss weiterhin die Quellen bauen. Es wurde nichts veröffentlicht.
