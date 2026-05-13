# FilmGuide Admin

Separate Admin-App fuer FilmGuide. Sie pflegt Filme in Supabase und speichert neue Packshots in Supabase Storage.

## Setup in Supabase

1. Oeffne dein bestehendes Supabase-Projekt `MrM-creates PhotoPay`.
2. Oeffne den SQL Editor.
3. Fuehre `supabase/filmguide_photopay_migration.sql` aus.
4. Gehe zu Authentication und lege deinen Admin-User an oder erlaube Sign-ups kurzzeitig.
5. Kopiere aus Project Settings > API:
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

## Erste Nutzung

1. Supabase URL und anon key eintragen.
2. Einloggen.
3. `Sheet importieren` klicken, um bestehende Filme nach Supabase zu uebernehmen.
4. Film aus der Liste waehlen oder `Neuer Film` klicken.
5. Daten bearbeiten und speichern.

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
```

So bleibt FilmGuide getrennt von PhotoPay-Tabellen und spaeteren Apps wie FilmLab.

## Naechster Schritt

Die bestehende Guide-App liest noch aus Google Sheets. Sobald Supabase eingerichtet und der Import getestet ist, kann `index.html` auf Supabase als Datenquelle umgestellt werden.
