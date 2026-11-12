# Prüfstand Fortbildungsweg 0.5.0

29.10.2026 · vollständiges Update auf Basis des letzten Förderassistenten-Pakets.

## Automatisch geprüft

`npm test` baut die komplette Seite und führt **157 Tests** aus: 157 bestanden, 0 fehlgeschlagen. Der Build erzeugt weiterhin `Ehrenhub.html` und `dist/index.html`, ohne zusätzliche npm-Pakete oder externe Laufzeit-Assets.

Die Tests umfassen weiterhin Wiki-Bausteine, Schichtplanung, PDF-Stundenplan-Generierung, Förderregeln, Original-PDFs, Suche, Routing, lokale Speicherung und Inhaltssicherheit. Bestehende Tests mit alten Demo-Kurs-IDs wurden auf echte Datensätze bzw. unabhängige Testdaten umgestellt; die getesteten Fähigkeiten wurden nicht entfernt.

Neu geprüft:

- Rekursiver Kurslader, Dateinamen/IDs, Duplikate, Entwürfe, Vorlage und Quellen.
- Pflichtfelder, gültige Kalenderdaten, Uhrzeiten, Fristen, Preise und Anerkennungswerte.
- Alle vier Ziele, Eingabe- und Ergebnisansichten, alte Kurslinks und erhaltene Lesezeichen.
- Fristgrenzen, Kursbeginn, mehrteilige Vor-/Nachtreffen, Stornierung, veralteter Prüfstand.
- Filterkombinationen, Grundkurs versus Vertiefung, keine falsche Stundenanrechnung.
- Drei-Jahres-Grenze des Erste-Hilfe-Nachweises einschließlich Schaltjahrfall.
- Speicherung erst nach Opt-in, Wiederherstellung, blockierter Speicher, begrenzter und bestätigter Dateiimport.
- Export-Handler für Lernweg-JSON und Kalender-ICS inklusive tatsächlicher Blob-Inhalte.
- Kalenderformat mit exklusivem Enddatum, mehreren Kursteilen, Text-Escaping und UTF-8-Zeilenfaltung.
- Unveränderte andere Browserdaten, globale Rücksetzung und gegen HTML-Injektion maskierte Texte.
- Build aus anderem Arbeitsverzeichnis sowie vollständige eigenständige HTML-Datei.

## Im Browser geprüft

- Desktop-Übersicht im bestehenden Design, Zielwahl und Fragen.
- Juleica-Erstweg mit vorhandener Grundausbildung und zu altem Erste-Hilfe-Nachweis.
- Einblendung des optionalen Kursdatums erst bei vorhandenem Nachweis.
- Verlängerungsweg mit nur belegter Anrechnungsmöglichkeit, ohne erfundene Stundenzahl.
- Speicherung eingeschaltet, Seite neu geladen, Lernweg wiederhergestellt.
- Kombinierte Filter Erste Hilfe + Umland + Unterhaching: genau ein Treffer.
- Kursdetail mit korrektem Original-Link; Merkliste zeigt den gespeicherten Zustand.
- Schmale Ansicht im 390-Pixel-Prüfrahmen: Lernweg und Katalog ohne horizontalen Dokumentüberlauf; Filter bedienbar. Kein echter iOS-/Android-Gerätetest.
- Keine beobachteten Fehler aus dem Ehrenhub-Anwendungscode. Die Testumgebung meldete zeitweise eigene Browser-Extension-Fehler.

Der Browser löste beim Kalenderknopf die Erfolgsmeldung aus; die automatisierte Übergabe des Downloads an die Testumgebung lief in ein Zeitlimit. Deshalb **kein bestätigter Import in Outlook/Apple/Google Kalender**. Der Export-Handler und die erzeugten Kalenderbytes wurden unabhängig automatisiert geprüft. Ein echter Kalenderimport und die Browser-Druckausgabe auf euren Geräten bleiben sinnvolle Abnahmetests.

## Erhalt des bisherigen Standes

Dateivergleich mit dem Ausgangspaket: Die Feature-Ordner für Schichtplan, Wiki und Förderassistent, der Wiki-Datenbestand, die Förderregeln und beide Original-PDFs wurden nicht geändert. Angepasst wurden der neue Fortbildungsbereich, seine redaktionellen Daten, gemeinsame Einbindung, aktuelle Hinweis-/Hilfetexte und Tests.

Kein Upload zu GitHub, kein Deployment und keine Änderung am bestehenden Pages-Workflow. Temporäre Dateien der lokalen Browserprüfung gehören nicht zum ZIP.

## Inhaltliche Grenzen

Fünf einmalig recherchierte Originaltermine, kein vollständiger Angebotsbestand und keine Live-Platzabfrage. Die Quellen und bewusst nicht übernommenen Termine sind in [FORTBILDUNGEN.md](FORTBILDUNGEN.md) dokumentiert. Die Redaktion muss die Termine weiter pflegen. Anerkennung, Voraussetzungen und Verbindlichkeit liegen beim Anbieter beziehungsweise Träger.

Vor öffentlichem Regelbetrieb bleiben fachliche Freigabe, abschließende rechtliche Prüfung und ausführlichere Barrierefreiheits-/Gerätetests erforderlich. Das Update ist kein Ersatz dafür.
