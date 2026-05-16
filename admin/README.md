# FilmGuide Admin

Separate Admin-App fuer FilmGuide. Sie pflegt Filme in Supabase und speichert neue Packshots in Supabase Storage.

## Setup in Supabase

1. Oeffne dein bestehendes Supabase-Projekt `MrM-creates PhotoPay`.
2. Oeffne den SQL Editor.
3. Fuehre `supabase/filmguide_photopay_migration.sql` aus.
4. Fuer Factsheet-Quellen und Proposal-Entwuerfe fuehre `supabase/filmguide_factsheet_sources.sql` aus.
5. Gehe zu Authentication und lege deinen Admin-User an oder erlaube Sign-ups kurzzeitig.
6. Kopiere aus Project Settings > API:
   - Project URL
   - anon public key

## Lokal starten

```bash
npm run admin:dev
```

Dann oeffnen:

```txt
http://localhost:4173/admin/
```

Optional fuer LLM-Vorschlaege:

```bash
cp .env.example .env
```

Dann `.env` bearbeiten:

```txt
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
```

Danach reicht wieder `npm run admin:dev`. Die Datei `.env` ist in `.gitignore` eingetragen und darf nicht committed werden.

`gpt-5-mini` ist der empfohlene Kosten-/Qualitaets-Default fuer diese Art strukturierter Vorschlaege. Fuer die beste Textqualitaet kann `OPENAI_MODEL=gpt-5.2` gesetzt werden.

## Erste Nutzung

1. Supabase URL und anon key eintragen.
2. Einloggen.
3. `Sheet importieren` klicken, um bestehende Filme nach Supabase zu uebernehmen.
4. Film aus der Liste waehlen oder `Neuer Film` klicken.
5. Daten bearbeiten und speichern.

## Factsheet-Vorschlaege

Die Admin-App kann vorhandene Textfassungen aus `outputs/factsheet-text/`, eingefuegten Factsheet-Text, Website-URLs oder PDFs lesen und daraus einen Film-Vorschlag erzeugen.

Der Vorschlag wird nicht automatisch gespeichert. Er wird direkt ins Formular uebernommen, kann dort redaktionell geprueft und danach normal gespeichert oder verworfen werden.

Die App extrahiert URL- und PDF-Inhalte ueber den lokalen Node-Server und versucht danach den Endpunkt `/api/factsheet/propose`. Wenn `OPENAI_API_KEY` gesetzt ist, erzeugt der Server einen kuratierteren LLM-Vorschlag. Ohne API-Key faellt die App automatisch auf die regelbasierte Browser-Auswertung zurueck.

Die lokale Fallback-Version arbeitet bewusst regelbasiert:

- technische Werte werden aus Factsheet-Begriffen und bekannten Filmnamen abgeleitet
- Kurzbeschreibung, Look, Belichtungs-, Entwicklungs- und Scan-Tipps werden als Review-Vorschlag formuliert
- `Review nötig` wird fuer uebernommene Vorschlaege automatisch gesetzt

Wenn die Supabase-Erweiterung `filmguide_factsheet_sources.sql` installiert ist und du eingeloggt bist, speichert die App die Quelle und den Proposal-Entwurf. PDF- und Textdateien werden im privaten Bucket `filmguide-factsheets` abgelegt. Der API-Key bleibt im lokalen Server und wird nicht an die Browser-App ausgeliefert.

Bereits gespeicherte Factsheets werden im Film-Menue den passenden Filmen zugeordnet und koennen dort angesehen oder heruntergeladen werden. Wenn kein Original-PDF vorhanden ist, erzeugt die Admin-App einen Text-Download aus den gespeicherten Filmdaten.

Bestehende Repo-Factsheets koennen einmalig nach Supabase importiert werden:

```bash
npm run factsheets:import-repo
```

Dafuer muessen `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` lokal in `.env` gesetzt sein. Den Service-Role-Key niemals committen.

## Bildablage

Neue Uploads landen im public Storage Bucket:

```txt
filmguide-packshots
```

Die Admin-App speichert die oeffentliche Bild-URL im Feld `image_url`.

## Tabellen

FilmGuide nutzt im gemeinsamen Supabase-Projekt bewusst eigene Namen:

```txt
filmguide_films
filmguide-packshots
filmguide_factsheet_sources
filmguide_film_proposals
filmguide-factsheets
```

So bleibt FilmGuide getrennt von PhotoPay-Tabellen und spaeteren Apps wie FilmLab.

## Naechster Schritt

Die bestehende Guide-App liest noch aus Google Sheets. Sobald Supabase eingerichtet und der Import getestet ist, kann `index.html` auf Supabase als Datenquelle umgestellt werden.
