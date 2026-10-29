# Prüfung des Förderassistenten-Updates

Stand: 28.10.2026 · Version 0.4.0

## Ausgangsbasis

Dieses vollständige Paket baut auf dem zuletzt gelieferten **Wiki-Redaktions-Update** mit grafischem Schichtplanexport auf. Es ist keine live abgeglichene Kopie eures aktuellen GitHub-Repositorys. Später selbst ergänzte Artikel oder Codeänderungen vor einem Ordner-Upload vergleichen und erhalten. Es wurde nichts auf GitHub oder einer öffentlichen Website veröffentlicht.

## Automatisiert erfolgreich

`npm test`: **136 Tests bestanden, 0 fehlgeschlagen**. Der Befehl führt vor den Tests den vollständigen Build aus. Keine installierten Projektabhängigkeiten notwendig.

Geprüft wurden unter anderem:

- bestehende Wiki-Redaktion, interaktive Bausteine, Suchfunktionen, Verweise, Merkliste, SOS und lokale Speicherfunktionen;
- bestehender Schichtplan inklusive Verteilung, Import/Export und grafischem Drucklayout;
- Förderberechnung mit Mindestpersonen, zwei Nächten, Förderhöchstdauer, Betreuungsunter-/obergrenze und anteiliger Zuordnung;
- bekannte, fehlende und ungeklärte Nachweise; nicht abgedeckte Organisationen/Regionen;
- erhöhter Auslandssatz, internationale Begegnung, Defizitbegrenzung, JBM/AEJ, Raumförderung und besondere Projekte;
- exakte 28-/56-Tage-Rechnung, Schaltjahr, Jahreswechsel, Sommerzeit-unabhängige Datumsdifferenzen, rechtzeitig oder verspätet eingereichte Anträge;
- beschädigte, übergroße und schemafremde JSON-Dateien, Versionswechsel, Text-Escaping, keine unzulässigen Rechenwerte;
- lokale Wiederherstellung, Checklisten, gezieltes Zurücksetzen, blockierter Browserspeicher, Export-Bytes und Importbestätigung;
- Datenvalidierung vor dem Build, HTTPS-Quellen, fehlende/kaputte Formulare und Regeln;
- vollständiger Build aus anderem Arbeitsverzeichnis in einem isolierten temporären Projekt;
- Original-PDFs unverändert eingebettet und nach `dist/formulare` kopiert.

Die SHA-256-Prüfsummen der beiden mitgelieferten Formulare stimmen mit den vom Team angehängten Originalen überein. Es wurden keine Formularfelder entfernt oder umgestaltet. Die erzeugte `Ehrenhub.html` ist bytegleich mit `dist/index.html`; ungefähr 1,1 MiB inklusive beider Original-PDFs. Rechenlogik und Formulare benötigen keinen externen Datenabruf.

## Im Browser geprüft

- bestehendes Ehrenhub-Design, Einstieg und dreistufiger Förderablauf;
- Beispielwochenende mit 720-Euro-Rechengröße und konkretem Fristdatum;
- Änderung auf fehlende Juleica: kein hervorgehobener planbarer Zuschuss, passender Ausbildungslink;
- Rückkehr zur gültigen Eingabe und Neuberechnung;
- Checkliste anklicken, Fortschrittsanzeige, Wiederherstellung nach Neuladen;
- responsive Darstellung in 390-/768-Pixel-Iframes, ohne horizontalen Seitenüberlauf der Handy-Ergebnisansicht;
- keine erfassten Fehler aus dem Website-JavaScript im getesteten Ablauf.

## Nicht als erledigt ausgeben

- Der Dateidownload ließ sich in der verfügbaren Browser-Testumgebung nicht bis zum gespeicherten Dateipfad bestätigen (Download-Ereignis ohne Abschluss). Die Download-Handler samt PDF-/JSON-Bytes sind automatisiert getestet, die Originale außerdem direkt im Paket. **Die beiden PDF-Downloads und einen JSON-Export/-Reimport im eigenen Browser abschließend testen.**
- Der Druckknopf ist angebunden und der Aufruf automatisiert geprüft. Die native Druckvorschau/PDF-Ausgabe ließ sich in dieser Browser-Testumgebung nicht visuell abnehmen. **A4-PDF im eigenen Browser erzeugen und Seitenumbrüche überprüfen.** Es wird kein visuell geprüftes Muster-PDF behauptet.
- Iframes ersetzen keinen echten iPhone-/Android-Test; Safari, Firefox, Screenreader und vollständige Barrierefreiheit wurden nicht abschließend geprüft.
- Kein Zugriff auf das geschützte KJR-Portal, keine echten Anträge, keine testweise Übermittlung von Personendaten.
- Keine fachliche Abnahme durch BDKJ/KJR und keine Gewähr für aktuelle Förderpraxis. Die dokumentierten Sonderfälle brauchen Rücksprache.

## Übergabe

Die ZIP enthält einen vollständigen Ordner `Ehrenhub`, einschließlich Quellen, Daten, Tests, Dokumentation, leeren Originalformularen und der direkt aufrufbaren HTML-Vorschau. Temporäre Browser-Testseiten und lokale Vorschau-Konfiguration sind nicht enthalten. Der bestehende GitHub-Pages-Workflow bleibt bei `npm run build` und Ausgabe `dist`.
