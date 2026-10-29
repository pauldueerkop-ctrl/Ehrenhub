# Förderassistent · Version 0.4.0

## Ausprobieren

`Ehrenhub.html` öffnen → **Antragsfinder → Mit Beispiel ausprobieren → Fördercheck berechnen**.
Das Beispiel hat 30 Münchner Teilnehmende, sechs Betreuende und zwei Übernachtungen. Bei bestätigten Nachweisen ergibt das rechnerisch 720 Euro. Der Beispieldatumsbereich liegt immer in der Zukunft. Es gibt keine Bewilligung und keine Antragstellung durch Ehrenhub.

## Was der neue Ablauf leistet

1. **Zuständigkeit und Vorhaben:** fünf Förderwege, aber keine automatische Übertragung der BDKJ-Regeln auf andere Organisationen oder reine Landkreisgruppen.
2. **Eckdaten:** Datum, Anzahlen, Nachweisstatus und – wo erforderlich – Kosten und andere Finanzierung. Keine Namen von Kindern, Anschriften oder Uploads sensibler Unterlagen.
3. **Fördercheck:** bedingte rechnerische Obergrenze, nachvollziehbare Positionen, erfüllte/offene/nicht erfüllte Voraussetzungen, Frist und Checklisten für Vorbereitung, Durchführung und Nachbereitung.

Der Rechner kennt Fahrten/Freizeiten, internationale Begegnungen, JBM/AEJ, Räume und besondere Projekte. Ein gewöhnliches Auslandszeltlager ist nicht automatisch eine internationale Begegnung. Ein Fortbildungskurs, den man selbst besucht, ist nicht dasselbe wie eine selbst organisierte AEJ-Maßnahme.

Bei verfehlten regulären Voraussetzungen wird kein Geldbetrag als planbarer Zuschuss hervorgehoben. Der Rechenwert steht dann ausschließlich als ausdrücklich hypothetische Größe weiter unten. Bei offenen Nachweisen bleibt der Klärungsbedarf sichtbar.

## Quellen und Abgrenzung

Technisch ausgewertete Grundlage ist die [ausführliche BDKJ-München-Maßnahmenrichtlinie vom 09.02.2026](https://bdkj-muenchen.de/wp-content/uploads/2026/02/2026-Zuschussrichtlinien-Massnahmenfoerderung.pdf), abgeglichen mit der [BDKJ-Übersicht](https://bdkj-muenchen.de/zuschuesse/), Quellenprüfung 28.10.2026. Der vom Team bereitgestellte KJR-Rahmenstand 01.01.2023 ist Hintergrund, nicht ein universeller Ersatz für die spezielleren Verbandsregeln. Der [BDKJ-Diözesanbereich](https://www.bdkj.org/aktuelles/zuschuesse-formulare/) ergänzt die übergeordneten JBM-/AEJ-Antragswege.

Bei widersprüchlicher Kurzbeschreibung wurde entsprechend der Teamentscheidung die Detailrichtlinie verwendet: zwei Übernachtungen bei Fahrten; internationale Begegnungen mit 15 Euro im Inland bzw. 25 Euro im Ausland. Alle Sätze sind pro anrechenbarer Person und Einheit, keine pauschalen Zusagen.

Die bereitgestellten Teilnehmer-/Betreuerlisten werden unverändert übernommen. Die offizielle BDKJ-Website beschreibt den Papierweg. Das Team verwendet auch Tablets: deshalb nennt die Oberfläche beide praktischen Möglichkeiten, verlangt aber eine Abstimmung zur Anerkennung digitaler Unterschriften. Vorab bekannte Angaben können ausgefüllt werden; persönlich zu leistende Unterschriften werden nicht vorweggenommen.

## Bewusste Berechnungsannahmen und Grenzen

- **Fahrten:** Anzahlen beziehen sich auf den förderfähigen Altersbereich; alle gezählten Personen nehmen vereinfachend durchgehend teil. Unterschiedliche An-/Abreise ist noch kein eigener Personen-Nächte-Editor.
- **Betreuung:** Mindestanzahl `ceil(Teilnehmende / 15)`, mindestens eine Person. Förderobergrenze vorsichtig `max(2, floor(Teilnehmende / 5))`. Bei nicht glattem 1:5-Verhältnis wird die Rundung ausdrücklich zur Klärung markiert. Gefördert wird maximal die tatsächlich angegebene Anzahl. Der Förderschlüssel ist keine pädagogische Betreuungsempfehlung.
- **Nachweise:** wie besprochen für alle tatsächlich Betreuenden gültige Juleica und Einsichtnahmebestätigung (drei Jahre ab Ausstellung) abgefragt. Keine automatische Prüfung der Dokumente. Pfarrbüro als praktischer Kontakt; laut Richtlinie auch JIZ-Bestätigung. Es werden keine Führungszeugnisse gesammelt.
- **Stadt/Landkreis:** getrennte Anteile, Betreuung proportional nach Teilnehmenden. Keine doppelte Finanzierung derselben Personen. Zuständigkeit/Weiterleitung muss bestätigt werden. Andere Regionen fließen in den Verteilungsschlüssel, nicht in den Fördersatz ein.
- **Zusätzliche notwendige Begleitung:** als Klärungsfall erfasst, nicht ohne bestätigte Zuordnung auf den Zuschuss aufgeschlagen. Keine Abfrage von Diagnosen.
- **On Tour:** Priorität gegenüber nachrangiger Förderung wird erläutert; verfügbare Mittel werden nicht live abgefragt.
- **Religiöse Bestandteile:** ein einzelner Gottesdienst im Zeltlager ist kein automatischer Ablehnungsgrund im Rechner. Die Abgrenzung rein religiöser Vorhaben bleibt fachlich zu klären; Inhalte und einzelne Kosten werden nicht automatisch bewertet.
- **Internationale Begegnung:** BJR-/KJP-Voraussetzungen, fachliche Anerkennung und Defizitgrenze. Ausländische Gäste nur im Inland und nur zugeordnet zu den förderfähigen Münchner Teilnehmenden. Betreuungszuordnung ist vereinfachend proportional zur entsendenden Gruppe; Sonderfälle bestätigen lassen.
- **JBM/AEJ:** Einheiten werden bewusst manuell eingegeben, nicht aus Kalendertagen erfunden. Fachliches Programm und anerkannter Zeitumfang werden nicht automatisch geprüft. Bei AEJ zählt die Tätigkeit für München; zusätzliche Seminarleitende werden nicht pauschal als Teilnehmende mitfinanziert.
- **Räume:** verbleibender Dreijahresrahmen und vorsichtige Begrenzung auf ungedeckte Kosten. Kein Zugriff auf historische Anträge, Ausgabenanerkennung oder verbindliche Budgetzuteilung.
- **Besondere Projekte:** Vorabgenehmigung und Budgetprüfung; Obergrenze keine zugesagte Auszahlung. Bei fehlender Vorabgenehmigung nach Ablauf des Vorlaufs wird eine reguläre Voraussetzung als nicht erfüllt markiert, nicht rechtsverbindlich über Ausnahmen entschieden.
- **Fristen:** 28 Kalendertage ab Ende bei Fahrten, Räumen und besonderen Projekten; besondere Projekte zusätzlich 56 Tage vor Beginn. Keine angenommene Feiertags-/Wochenendverlängerung. Für internationale Begegnungen/JBM/AEJ keine pauschale Vier-Wochen-Frist erfunden.
- **Eingereichter Antrag:** tatsächliches Eingangsdatum kann erfasst werden. Rechtzeitiger Eingang wird später nicht als überfällig angezeigt. Das bestätigt weder Vollständigkeit noch Auszahlung. Antragsstatus wird nicht live mit dem Portal synchronisiert.

Vor produktiver Finanzplanung sind diese Auslegungen mit der Förderstelle abzunehmen. Das Ergebnis ist ein überprüfbarer Prototyp, keine finanzielle oder rechtliche Fachfreigabe.

## Speichern, weitergeben, drucken

Ein aktueller Entwurf wird automatisch unter `ehrenhub.v1.fundingPlan` in diesem Browser gespeichert. Kein Konto, keine zentrale Datenbank, keine Synchronisierung. Bei blockiertem Speicher kann man trotzdem rechnen und eine JSON-Sicherung verwenden. Browserdaten löschen, Privatmodus, andere Website-Adresse oder anderer Browser können den Entwurf verlieren bzw. nicht anzeigen.

**Projekt speichern** exportiert Angaben und Häkchen als `Ehrenhub-Foerdercheck.json`. **Projekt öffnen** liest diese Datei nach Prüfung und Bestätigung. Maximal 100 KB, festes Schema, keine fremden Objektfelder oder HTML-Ausführung. Bei geändertem Richtlinienstand startet die Prüfung wieder bei Schritt 1. Auch interne Budgetdaten können vertraulich sein: Projektdateien nicht ins öffentliche Repository hochladen.

Geänderte Eckdaten setzen Checklisten zurück. **Neuer Fördercheck** betrifft nur diesen Bereich, nicht Schichtplan und Merkliste. **Lokale Daten zurücksetzen** im allgemeinen Dialog löscht weiterhin alle Ehrenhub-Speicherbereiche.

**Förderplan drucken / PDF** verwendet die Druckfunktion des Browsers. Dort „Als PDF speichern“, A4-Hochformat und gegebenenfalls Kopf-/Fußzeilen ausschalten. Der Druck blendet Navigation, Maskottchen und Eingabebedienung aus; Ergebnis, Fristen und Checklisten bleiben. Das ist kein fertiger offizieller Antrag. Die beiden leeren Originalformulare werden separat heruntergeladen; sie sind zusätzlich unter `public/formulare/` enthalten.

## Erweiterungen

`model.js` rechnet ohne DOM oder Backend und kann später von einem Finanzplaner genutzt werden. `view.js`, `controller.js` und `styles.css` sind getrennt. Sätze, Quellverweise und Kartentexte liegen in `data/foerderung/`. Neue Verbandsregeln benötigen eine eigene fachlich geprüfte Regelstrecke, nicht nur eine kopierte JSON-Datei. Die übrigen Funktionen bleiben unangetastet; Fortbildungsangebote sind weiterhin Beispiele.

## Sinnvolle gemeinsame Abnahme

Mit euren echten, bereits abgeschlossenen Aktionen vergleichen: ein normales Wochenende, ein Zeltlager, gemischte Stadt-/Landgruppe, nicht glatter Betreuungsschlüssel und eine rechtzeitig eingereichte ältere Aktion. Keine personenbezogenen Listen hochladen. Unterschiedliche Ergebnisse mit der tatsächlichen Förderstelle klären, bevor daraus verbindliche Budgetannahmen werden.
