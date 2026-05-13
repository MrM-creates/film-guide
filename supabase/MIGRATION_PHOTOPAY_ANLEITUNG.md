# FilmGuide nach PhotoPay-Supabase migrieren

Ziel: FilmGuide nutzt nicht mehr das separate Projekt `Film_Stock_Guide`, sondern das bestehende Projekt `MrM-creates PhotoPay`.

## 1. SQL in PhotoPay ausfuehren

1. Supabase oeffnen.
2. Projekt `MrM-creates PhotoPay` anklicken.
3. Links `SQL Editor` oeffnen.
4. `New query` klicken.
5. Den kompletten Inhalt aus dieser Datei einfuegen:

```txt
supabase/filmguide_photopay_migration.sql
```

6. `Run` klicken.

Das legt an:

```txt
filmguide_films
filmguide-packshots
```

und importiert die 17 vorhandenen FilmGuide-Filme.

## 2. Kurz pruefen

Im SQL Editor danach diese Zeile ausfuehren:

```sql
select count(*) from public.filmguide_films;
```

Erwartetes Ergebnis:

```txt
17
```

## 3. API-Werte kopieren

In Supabase:

1. `Project Settings` oeffnen.
2. `API` oeffnen.
3. Diese zwei Werte kopieren:

```txt
Project URL
anon public / publishable key
```

## 4. Admin App verbinden

1. FilmGuide Admin App oeffnen.
2. Kontomenue oben rechts oeffnen.
3. `Verbindung bearbeiten` klicken.
4. PhotoPay `Project URL` und `Publishable Key` eintragen.
5. Speichern.
6. Einloggen.

Wenn alles stimmt, sieht die Admin App die 17 Filme aus `filmguide_films`.

## 5. Public Guide umstellen

In `index.html` muessen diese zwei Konstanten auf das PhotoPay-Projekt zeigen:

```js
const SUPABASE_URL = "...";
const SUPABASE_PUBLISHABLE_KEY = "...";
```

Die Tabelle ist bereits angepasst:

```js
const SUPABASE_FILMS_TABLE = "filmguide_films";
```

## 6. Altes Projekt erst danach loeschen

Das alte Projekt `Film_Stock_Guide` erst loeschen, wenn:

1. `select count(*)` in PhotoPay `17` zeigt.
2. Die Admin App mit PhotoPay funktioniert.
3. Die normale FilmGuide-Seite Filme laedt.

Das einzige alte Supabase-Storage-Bild wurde lokal gesichert als:

```txt
img/packshots-vintage/fomapan-400.png
```
