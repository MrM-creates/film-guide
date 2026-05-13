-- FilmGuide Supabase setup
-- Run this in the Supabase SQL editor of the project you want to use.

create extension if not exists pgcrypto;

create table if not exists public.filmguide_films (
  id text primary key,
  brand text not null,
  name text not null,
  film_type text not null default 'Color Negative',
  process text not null default 'C-41',
  iso_box integer not null default 0,
  formats text[] not null default '{}',
  use_cases text[] not null default '{}',
  grain text not null default '',
  saturation text not null default '',
  tone text not null default '',
  contrast text not null default '',
  look_description text not null default '',
  price_level text not null default '',
  exposure_latitude text not null default '',
  exposure_note text not null default '',
  short_description text not null default '',
  tip_exposure text not null default '',
  tip_development text not null default '',
  tip_scan text not null default '',
  image_url text not null default '',
  image_path text not null default '',
  review_needed boolean not null default false,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists filmguide_films_brand_name_idx on public.filmguide_films (brand, name);
create index if not exists filmguide_films_active_idx on public.filmguide_films (active);

grant usage on schema public to anon, authenticated;
grant select on public.filmguide_films to anon;
grant select, insert, update, delete on public.filmguide_films to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists filmguide_films_set_updated_at on public.filmguide_films;
create trigger filmguide_films_set_updated_at
before update on public.filmguide_films
for each row
execute function public.set_updated_at();

alter table public.filmguide_films enable row level security;

drop policy if exists "FilmGuide films are readable by everyone" on public.filmguide_films;
create policy "FilmGuide films are readable by everyone"
on public.filmguide_films for select
using (true);

drop policy if exists "Authenticated users can insert FilmGuide films" on public.filmguide_films;
create policy "Authenticated users can insert FilmGuide films"
on public.filmguide_films for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update FilmGuide films" on public.filmguide_films;
create policy "Authenticated users can update FilmGuide films"
on public.filmguide_films for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete FilmGuide films" on public.filmguide_films;
create policy "Authenticated users can delete FilmGuide films"
on public.filmguide_films for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('filmguide-packshots', 'filmguide-packshots', true, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "FilmGuide packshots are publicly readable" on storage.objects;
create policy "FilmGuide packshots are publicly readable"
on storage.objects for select
using (bucket_id = 'filmguide-packshots');

drop policy if exists "Authenticated users can upload FilmGuide packshots" on storage.objects;
create policy "Authenticated users can upload FilmGuide packshots"
on storage.objects for insert
to authenticated
with check (bucket_id = 'filmguide-packshots');

drop policy if exists "Authenticated users can update FilmGuide packshots" on storage.objects;
create policy "Authenticated users can update FilmGuide packshots"
on storage.objects for update
to authenticated
using (bucket_id = 'filmguide-packshots')
with check (bucket_id = 'filmguide-packshots');

drop policy if exists "Authenticated users can delete FilmGuide packshots" on storage.objects;
create policy "Authenticated users can delete FilmGuide packshots"
on storage.objects for delete
to authenticated
using (bucket_id = 'filmguide-packshots');

-- Seed current FilmGuide data exported from the old Film_Stock_Guide project.
insert into public.filmguide_films (id, brand, name, film_type, process, iso_box, formats, use_cases, grain, saturation, tone, contrast, look_description, price_level, exposure_latitude, exposure_note, short_description, tip_exposure, tip_development, tip_scan, image_url, image_path, review_needed, notes, active, created_at, updated_at)
values
  ('cinestill_800t', 'Cinestill', '800T', 'Color Negative', 'C-41', 800, array['135', '120']::text[], array['Street', 'Low Light', 'Night', 'Experimental', 'Neon']::text[], 'Sichtbar', 'Mittel', 'Kühl', 'Mittel', 'Tungsten-balanced Farbfilm mit kühlem Tageslicht-Look, charakteristischer roter Halation um Lichtquellen, sichtbarem Korn und filmischem Kontrast.', 'Premium', 'Hoch', 'Kein einfaches EV-Fenster: CineStill nennt No Push EI 200–1000; Push-Verarbeitung für höhere EI bis 3200. Tageslicht mit 85B-Filter bzw. ISO 400–500 beachten.', 'Tungsten-balanced Farbfilm mit Kinolook, sichtbarer Halation und starkem Charakter bei Kunstlicht, Nacht und Neon.', 'Unter Kunstlicht ISO 800. Bei Tageslicht 85B-Filter oder manuell wärmen, sonst starker Blaustich. Bei wenig Licht sinnvoll leicht überbelichten (+1/3 EV), um Schattenzeichnung zu halten.', 'C-41 Standard. Kein Remjet → etwas mehr Halation und teils höhere Empfindung gegenüber Kratzern im Labor.', 'Halation bewusst erhalten – nicht komplett neutralisieren. Weißabgleich sanft Richtung warm schieben, besonders bei Tageslicht-Aufnahmen.', '../img/packshots-vintage/cinestill-800t.webp', '', true, 'Quelle ist URL, kein lokales PDF; daylight rating mit 85 Filter separat beachten.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T16:00:56.103415+00:00'),
  ('foma_fomapan_200', 'Foma', 'Fomapan 200', 'B&W', 'B&W', 200, array['135', '120', 'Sheet']::text[], array['Experimental', 'Portrait', 'Studio']::text[], 'Sichtbar', 'Monochrom', 'Monochrom', 'Mittel', 'Klassischer Schwarzweißlook mit sichtbarem, etwas rauerem Korn als bei Premiumfilmen. Neutrale bis leicht kühle Tonwerte, mittlerer Kontrast und etwas sensiblere Schattenzeichnung.', 'Budget', 'Mittel', '-2 EV bis +1 EV laut Hersteller ohne Prozessänderung; in der Praxis Schatten eher vorsichtig behandeln.', 'Günstiger Schwarzweißfilm mit klassischem Look, sichtbarem Korn und guter Schärfe. Geeignet für kontrolliertes Licht, Portraits und kreative Experimente.', 'Als ISO 160–200 arbeiten für beste Schattenzeichnung. In kontrastreichem Licht lieber –1/3 EV halten, um Lichter zu schützen.', 'Rodinal für betontes Korn und knackigeren Look. D-76 / ID-11 für harmonischere Tonwerte. Pushentwicklung möglich, aber mit Qualitätsverlust (mehr Korn, härtere Schatten).', 'Kontrast bei Bedarf leicht erhöhen, um die Tontrennung zu optimieren. Vorsichtig mit Schattenaufhellung – sonst wirkt das Korn gröber.', '../img/packshots-vintage/fomapan-200.webp', '', false, '', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('fomapan_400', 'Foma', 'Fomapan 400', 'B&W', 'B&W', 400, array['135', '120', 'Instax']::text[], array['Street', 'Low Light', 'Action']::text[], 'Sichtbar', 'Monochrom', 'Kühl', 'Mittel', 'Klassischer Schwarzweiß-Look mit sichtbarem, charakterstarkem Korn und ausgewogenen bis mittleren Kontrasten. Solide Detail- und Konturenschärfe.', 'Budget', 'Hoch', 'Der Film kann bis zu 2 Blenden unterbelichtet werden (ISO 1600), ohne dass die Entwicklungszeit oder Temperatur angepasst werden muss. Toleriert eine Überbelichtung um 1 Blende (ISO 200) ohne Änderung der Standardentwicklung.', 'Ein flexibler Schwarzweißfilm für schlechte Lichtverhältnisse, schnelle Action und kurze Verschlusszeiten. Er bietet eine beachtliche Belichtungstoleranz und klassischen Korn-Charakter.', 'Perfekt für "Available Light" und Action. Sehr flexibel bei Fehlbelichtungen (ISO 200 bis ISO 1600 können laut Hersteller mit derselben Entwicklungszeit verarbeitet werden). Achtung bei Langzeitbelichtungen: Der Schwarzschild-Effekt erfordert bereits ab 1/2 Sekunde eine Verlängerung der Belichtungszeit.', 'Sehr gutmütig in Standardentwicklern wie ID-11 / D-76 oder Xtol. Für eine optimale Empfindlichkeitsausnutzung wird Ilford Microphen empfohlen. Wer experimentieren möchte, kann ihn auch im Umkehrprozess zu SW-Dias entwickeln.', 'Das Korn ist deutlich als Gestaltungsmerkmal sichtbar. Bei kontrastreichen Motiven flacher scannen und den Schwarzpunkt erst in der Nachbearbeitung final setzen, um Tonwerte in den Schatten zu retten.', '../img/packshots-vintage/fomapan-400.png', '', false, '', true, '2026-05-11T16:36:31.373609+00:00', '2026-05-11T16:43:35.534462+00:00'),
  ('fujifilm_provia_100f', 'Fujifilm', 'Provia 100F', 'Slide', 'E-6', 100, array['135', '120', 'Sheet']::text[], array['Landscape', 'Studio', 'Travel']::text[], 'Fein', 'Natürlich', 'Neutral', 'Mittel', 'Kühle bis neutrale Farbbalance, feines Korn und hohe Schärfe. Natürlicher und etwas toleranter als Velvia, aber weiterhin diafilmtypisch präzise zu belichten.', 'Premium', 'Gering', '-0.5 bis +2 Stops ist Push/Pull-Verarbeitungsbereich. Praktische Belichtung bleibt diafilmtypisch eng; toleranter als Velvia, aber nicht farbnegativfilm-tolerant.', 'Neutraler Diafilm mit hoher Schärfe und feinem Korn. Ideal, wenn natürliche Farbwiedergabe und Detailtreue gefragt sind.', 'Auf die Highlights messen. Leicht unterbelichten (–0.3 EV) bewahrt die Zeichnung in hellen Bereichen.', 'E-6 Standard. Push bis 200 möglich; Farben werden dabei etwas lebendiger, Kontrast steigt moderat.', 'Neutrales Profil, Blau/Magenta leicht kontrollieren bei Hauttönen. Tiefen minimal anheben, ohne die Schatten zu öffnen.', '../img/packshots-vintage/fujifilm-provia-100f-100.webp', '', true, 'Bei Diafilm praktische Belichtung enger; Wert ist Push/Pull-Verarbeitungsbereich.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('fujifilm_velvia_50', 'Fujifilm', 'Velvia 50', 'Slide', 'E-6', 50, array['135', '120', '4x5']::text[], array['Landscape', 'Studio', 'Sunny', 'Travel']::text[], 'Fein', 'Hoch', 'Warm', 'Hoch', 'Sehr satte Farben (stark in Rot- und Grüntönen). Hoher Kontrast, tiefes Schwarz. Feinstes Korn, sehr hohe Schärfe.', 'Premium', 'Gering', '-0.5 bis +1 Stop ist Push/Pull-Verarbeitungsbereich, nicht praktische Belichtungstoleranz. Diafilm: Highlights sehr präzise schützen.', 'Extrem gesättigter Diafilm für Landschaft und Natur. Sehr hohe Schärfe und Farbdichte bei präziser Belichtung und idealem Licht.', 'Lichter schützen: lieber –0.3 bis –0.7 EV. Null Fehlertoleranz bei Überbelichtung.', 'E-6 Standardprozess → Push nur in Ausnahmefällen, da zusätzliche Kontraststeigerung', 'Neutral scannen. Highlights schützen, Schwarztöne leicht anheben. Keine automatische Farbstichkorrektur auf Rot/Magenta – sonst verliert Velvia seinen typischen Look.', '../img/packshots-vintage/fujifilm-velvia-50-50.webp', '', true, 'Bei Diafilm praktische Belichtung trotzdem enger; Wert ist Push/Pull-Verarbeitungsbereich.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('ilford_delta_3200', 'Ilford', 'Delta 3200', 'B&W', 'B&W', 3200, array['135', '120']::text[], array['Action', 'Experimental', 'Low Light', 'Night', 'Street']::text[], 'Grob', 'Monochrom', 'Monochrom', 'Hoch', 'Deutlich sichtbares, charaktervolles Korn. Hoher Kontrast, dramatische Tonwerte. Sehr urbaner, rauer Stil.', 'Premium', 'Sehr hoch', '-1 EV bis +3 EV | recommended EI 1600-6400 and good quality EI 400-6400; box EI 3200.', 'Hochempfindlicher Schwarzweißfilm für Available Light, Nacht, Konzerte und schnelle Street-Szenen ohne Blitz. Sichtbares Korn und dramatischer Charakter gehören zum Look.', 'Als ISO 1600–3200 belichten für beste Ergebnisse. In extrem wenig Licht +1 EV geben, um Schattenzeichnung zu erhalten.', 'Ideal zum Pushen: 3200 → 6400 möglich = intensiveres Korn, dramatischerer Look. Entwicklerwahl stark lookbestimmend: Microphen / DD-X für mehr Schattendetails.', 'Flacher scannen → Kontrast gezielt später setzen. Korn nicht weichbügeln — das ist Teil der Bildsprache.', '../img/packshots-vintage/ilford-delta-3200.webp', '', true, 'ISO speed rating is 1000 but product/meter setting is EI 3200; UI keeps ISO Box 3200.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('ilford_fp4_plus', 'Ilford', 'FP4 Plus', 'B&W', 'B&W', 125, array['135', '120', 'Sheet']::text[], array['Landscape', 'Portrait', 'Studio']::text[], 'Fein', 'Monochrom', 'Monochrom', 'Mittel', 'Neutraler Tonbereich mit sauberen Graustufen. Feines Korn, gute Schärfe. Etwas geringerer Kontrast als HP5 – sehr klassischer, ruhiger Look.', 'Mittel', 'Sehr hoch', '-2 EV bis +6 EV | usable results overexposed by as much as six stops or underexposed by two stops.', 'Feinkörniger Schwarzweißfilm mit sehr guter Detailwiedergabe. Ideal für Portraits, Studio und kontrollierte Lichtsituationen.', 'Bei ISO 100–125 arbeiten für bestes Ergebnis. Leichte Überbelichtung (+1/3 EV) sorgt für weiche Hauttöne und feinen Detailerhalt in den Schatten.', 'D-76 / ID-11 für ausgewogenen Look. HC-110 für etwas mehr Kontrast und Schärfeeindruck. Push möglich, aber nicht optimal → Korn wirkt dann härter.', 'Neutrales Profil. Schatten nicht übertrieben öffnen, damit der charakteristisch klassische Eindruck bestehen bleibt. Feines Korn ermöglicht gute Vergrößerungen.', '../img/packshots-vintage/ilford-fp4plus-125.webp', '', false, '', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('ilford_hp5_plus', 'Ilford', 'HP5 Plus', 'B&W', 'B&W', 400, array['135', '120', 'Sheet']::text[], array['Action', 'Low Light', 'Portrait', 'Reportage', 'Street', 'Travel']::text[], 'Sichtbar', 'Monochrom', 'Monochrom', 'Mittel', 'Klassisches, sichtbares Korn. Ausgewogene Kontraste mit guter Zeichnung in Schatten und Lichtern. Zeitloser Dokumentarlook.', 'Mittel', 'Sehr hoch', 'Sehr flexibel, aber EI 800–3200 erfordert angepasste Entwicklung. Plus-Spielraum nicht numerisch belegt; Overexposure nicht als konkreter EV-Wert führen.', 'Vielseitiger Schwarzweißfilm mit großem Praxis-Spielraum. Sehr gute Wahl für Street, Reportage und Available-Light-Situationen.', 'Als ISO 400–800 top. Push bis 1600 oder 3200 problemlos möglich → stärkeres Korn, kräftigerer Look.', 'Sehr flexibel: ID-11 / D-76 für ausgewogenen Look, HC-110 für mehr Kontur, Rodinal für betontes Korn. Push-Entwicklung funktioniert hervorragend.', 'Kontrast oft etwas höher einstellen, aber Schatten nicht komplett öffnen → Filmcharakter behalten. Korn bewusst als Gestaltungselement nutzen.', '../img/packshots-vintage/ilford-hp5-plus-400.webp', '', true, 'Plus-Spielraum offen lassen; Overexposure nicht konkret als EV-Wert belegt.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_ektar_100', 'Kodak', 'Ektar 100', 'Color Negative', 'C-41', 100, array['135', '120', '4x5', '8x10']::text[], array['Landscape', 'Studio', 'Sunny', 'Travel']::text[], 'Fein', 'Hoch', 'Kühl', 'Hoch', 'Sehr kräftige, gesättigte Farben. Hoher Mikrokontrast, besonders klare Rot- und Blautöne. Hauttöne können kühl und unnatürlich wirken.', 'Premium', 'Mittel', 'Belichtungsspielraum nicht als konkretes EV-Fenster belegt.', 'Farbfilm mit extrem feinem Korn und sehr hoher Schärfe. Ideal für Landschaften und detailreiche Motive bei gutem Licht.', 'Als ISO 80–100 arbeiten. Bei hartem Sonnenlicht lieber –0.3 EV, um Clippen in Highlights zu vermeiden.', 'C-41 Standard. Push möglich, aber nicht ideal — Kontrast steigt und Farbbalance wird unruhiger.', 'Farbsättigung bewusst kontrollieren, starke Blau-/Rottöne leicht abmildern. Feines Korn ideal für große Prints.', '../img/packshots-vintage/kodak-ektar-100.webp', '', true, 'Belichtungsspielraum nicht als konkretes EV-Fenster belegt.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_gold_200', 'Kodak', 'Gold 200', 'Color Negative', 'C-41', 200, array['135', '120']::text[], array['Snapshot', 'Sunny', 'Travel']::text[], 'Fein', 'Hoch', 'Warm', 'Mittel', 'Warme Grundtöne, besonders in Gelb- und Rotbereichen. Klassisches Korn, leicht nostalgischer Farbstich. Etwas stärkerer Kontrast bei hartem Licht.', 'Budget', 'Hoch', '-2 EV bis +3 EV | wide exposure latitude from two stops underexposure to three stops overexposure.', 'Günstiger Alltagsfilm mit warmem Look für Sonne, Reisen und spontane Aufnahmen. Einsteigerfreundlich und fehlerverzeihend.', 'Gutes Licht bevorzugt → +1/3 bis +2/3 EV für saubere Schatten und etwas feineres Korn. In Schattenbereichen vorsichtig, da Zeichnung schnell verloren geht.', 'C-41 Standard. Push auf ISO 400 möglich, führt aber zu merklich mehr Korn und weniger Sanftheit.', 'Warme Farben bewusst nutzen, nicht zu stark neutralisieren. Schatten leicht anheben, um Muddy-Look zu vermeiden.', '../img/packshots-vintage/kodak-gold-200.webp', '', false, '', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodacolor_200', 'Kodak', 'Kodacolor 200', 'Color Negative', 'C-41', 200, array['135']::text[], array['Snapshot', 'Sunny', 'Street', 'Travel']::text[], 'Fein', 'Hoch', 'Neutral bis warm', 'Mittel', 'Moderner Consumer-Farbfilm mit klassischer Kodak-Anmutung. Feines Korn, gesättigte Farben, hohe Schärfe und konsistente Farbwiedergabe bei Tageslicht.', 'Budget', 'Hoch', 'URL-only; Belichtungsspielraum nicht konkret numerisch auf der Produktseite.', 'Moderner ISO-200 Consumer-Farbfilm für Alltag, Reisen und Street bei Tageslicht. Bietet feines Korn, gesättigte Farben, hohe Schärfe und einen klassischen Kodak-ähnlichen Look.', 'Bei hartem Licht ISO 200 belassen; leichte Überbelichtung von +1/3 bis +1 EV kann Schatten sauberer machen.', 'Standard C-41. Bei Belichtung auf ISO 100 (wie in deiner FE2) keine Push-Entwicklung nötig; die Überbelichtung sorgt für dichte Negative.', 'Vermeide "Kodak Gold" Presets, da diese die Schatten zu stark in Richtung Orange ziehen.', '../img/packshots-vintage/kodacolor-200.webp', '', true, 'URL-only; Belichtungsspielraum nicht konkret numerisch auf der Produktseite.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_portra_160', 'Kodak', 'Portra 160', 'Color Negative', 'C-41', 160, array['135', '120', '4x5']::text[], array['Portrait', 'Studio', 'Travel', 'Wedding']::text[], 'Fein', 'Natürlich', 'Neutral', 'Weich', 'Sehr weiche, neutrale Farbtöne. Extrem feines Korn mit hoher Schärfe. Besonders harmonische Hauttöne, weniger Pastell als Portra 400 bei Überbelichtung.', 'Premium', 'Hoch', 'Belichtungsspielraum nicht als konkretes EV-Fenster belegt.', 'Feinkörniger Profi-Farbfilm mit sehr natürlicher Farbwiedergabe und exzellenter Detailreproduktion. Ideal für Portraits, Studio und kontrolliertes Licht.', 'Als ISO 100–125 raten (+1/3 bis +2/3 EV) ergibt die sanftesten Hauttöne. Bei gemischtem Licht ISO 160 belassen.', 'C-41 Standardprozess. Push bis ISO 320 möglich, führt zu etwas mehr Kontrast ohne groben Qualitätsverlust.', 'Sehr neutrale Basis – Weißabgleich nur minimal korrigieren. Schatten vorsichtig öffnen, um den natürlichen Look beizubehalten.', '../img/packshots-vintage/kodak-portra-160.webp', '', true, 'Belichtungsspielraum nicht als konkretes EV-Fenster belegt.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_portra_400', 'Kodak', 'Portra 400', 'Color Negative', 'C-41', 400, array['135', '120', '4x5']::text[], array['Portrait', 'Street', 'Sunny', 'Travel', 'Wedding']::text[], 'Fein', 'Natürlich', 'Warm', 'Weich', 'Sanfte, warme Farben mit zarten Pastelltönen bei Überbelichtung. Sehr feines, organisches Korn und weicher Kontrast – besonders schmeichelhaft für Haut.', 'Premium', 'Hoch', 'Belichtungsspielraum aus Factsheet nicht als konkretes EV-Fenster belegt; vorhandene Tipps bleiben Praxiswerte.', 'Flexibler Profi-Farbfilm mit natürlichen Hauttönen, feinem Korn und sehr hoher Belichtungstoleranz. Zuverlässige Wahl für Portraits, Reportage und Reisen bei unterschiedlichsten Lichtbedingungen.', 'Für maximale Qualität als ISO 200 raten (+1 EV). Bei schwachem Licht ISO 400–800 möglich. Lichter sind sehr verzeihend.', 'C-41 Standard. Push bis 800 sehr gut nutzbar, minimal härterer Look.', 'Neutraler Weißabgleich genügt. Schatten können leicht angehoben werden, ohne starken Kornzuwachs. Sehr scan-freundliche Farbstruktur.', '../img/packshots-vintage/kodak-portra-400.webp', '', true, 'Belichtungsspielraum aus Factsheet nicht als konkretes EV-Fenster belegt; vorhandene Tipps bleiben Praxiswerte.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_portra_800', 'Kodak', 'Portra 800', 'Color Negative', 'C-41', 800, array['135', '120']::text[], array['Low Light', 'Portrait', 'Street', 'Travel', 'Wedding']::text[], 'Sichtbar', 'Natürlich', 'Warm', 'Mittel', 'Etwas kräftigeres Korn als Portra 400, aber weiterhin weiche, natürliche Farben. Leicht warm, angenehme Hauttöne, guter Erhalt von Details in den Schatten.', 'Premium', 'Hoch', '-2 EV bis ? | Factsheet includes EI 1600 and EI 3200 push curves; plus side not numeric.', 'Lichtstarker Farbfilm mit sehr guten Hauttönen für Portraits, Weddings und Available-Light-Situationen. Ideal, wenn Portra-Look bei wenig Licht gefragt ist.', 'Für sauberere Ergebnisse gerne wie ISO 400–640 raten (+2/3 bis +1 EV). Bei sehr wenig Licht auf ISO 800 bleiben, um Verwackeln zu vermeiden.', 'C-41 Standardprozess. Push bis ISO 1600 möglich, führt zu deutlich mehr Korn und Kontrast – eher stilistischer Effekt.', 'Leicht warme Grundtönung, besonders unter Kunstlicht. Weißabgleich sparsam korrigieren, um den typischen Portra-Look nicht zu verlieren. Schatten vorsichtig anheben, damit das Korn nicht zu dominant wird.', '../img/packshots-vintage/kodak-portra-800.webp', '', true, 'Plus-Spielraum offen lassen; Portra 800 Factsheet nennt best-in-class underexposure latitude.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_tri_x_400', 'Kodak', 'Tri-X 400', 'B&W', 'B&W', 400, array['135', '120']::text[], array['Action', 'Low Light', 'Reportage', 'Street', 'Travel']::text[], 'Sichtbar', 'Monochrom', 'Monochrom', 'Hoch', 'Markantes klassisches Korn, kräftiger Mikrokontrast und direkter Reportage-Look. Rau, lebendig und sehr ausdrucksstark.', 'Mittel', 'Sehr hoch', 'Wide exposure latitude und sehr gut pushbar; -3 EV nur als Push-/Unterbelichtungs-Praxiswert, nicht als normales EV-Fenster ohne Entwicklungsanpassung.', 'Klassischer Schwarzweißfilm mit unverwechselbarem Charakter. Ideal für Street, Reportage und Situationen mit wenig Licht.', 'Markantes, grobkörnigeres Korn. Hoher Mikrokontrast. Typischer Zeitungs-Reportagelook: rau, direkt und sehr ausdrucksstark.', 'Sehr vielseitig: D-76 für klassischen Look, Rodinal für ausgeprägtes Korn, HC-110 für etwas mehr Kontrast. Push-Entwicklung funktioniert hervorragend.', 'Kontrast oft etwas hoch → flacher scannen und Kontrast in der Nachbearbeitung gezielt setzen. Korn als Gestaltungselement beibehalten.', '../img/packshots-vintage/kodak-tri-x-400.webp', '', true, 'Plus-Spielraum nicht als konkretes EV-Fenster belegt.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('kodak_ultramax_400', 'Kodak', 'Ultramax 400', 'Color Negative', 'C-41', 400, array['135']::text[], array['Snapshot', 'Street', 'Sunny', 'Travel']::text[], 'Sichtbar', 'Hoch', 'Warm', 'Mittel', 'Kräftige, etwas warm verschobene Farben. Sichtbares, aber angenehmes Korn. Leicht höherer Kontrast für einen lebendigen, konsumententypischen Look.', 'Budget', 'Mittel', 'Belichtungsspielraum nicht als konkretes EV-Fenster belegt; Factsheet betont underexposure protection.', 'Günstiger Allround-Farbfilm für Alltag, Reisen, Street und spontane Aufnahmen. Besonders stark bei Tageslicht, Blitz und gut beleuchteten Situationen.', 'Am besten bei ISO 200 belichten (+1 EV) für sattere Farben und weniger Korn. Bei schwachem Licht auf ISO 400 bleiben.', 'C-41 Standard. Push bis 800 möglich, aber Korn und Kontrast werden deutlich stärker.', 'Warmton leicht kontrollieren. Schatten vorsichtig aufhellen, sonst stärkeres Rauschen. Gut für leichte Farb-Punch-Looks.', '../img/packshots-vintage/kodak-ultramax-400-400.webp', '', true, 'Belichtungsspielraum nicht als konkretes EV-Fenster belegt; Factsheet betont underexposure protection.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00'),
  ('lomography_lomography_800', 'Lomography', 'Lomography 800', 'Color Negative', 'C-41', 800, array['135', '120']::text[], array['Low Light', 'Reportage']::text[], 'Sichtbar', 'Hoch', 'Warm', 'Mittel', 'Lebendige, teilweise unvorhersehbare Farben mit leichtem Retro-Touch. Sichtbares, charaktervolles Korn und tendenziell warme, kontrastreiche Ergebnisse.', 'Mittel', 'Hoch', 'Kein lokales Factsheet; Belichtungsspielraum nicht belastbar aus Herstellerdaten belegt.', 'Vielseitiger 800er Farbfilm mit kräftigen Farben und solider Low-Light-Performance. Ideal für Reisen, Snapshot-Situationen und urbane Szenen bei wenig Licht.', 'Gerne leicht überbelichten (+1/3 bis +2/3 EV) für sattere Farben und etwas feineres Korn. Bei Night-Shots auf ISO 800 bleiben.', 'C-41 Standard. Push bis 1600 möglich, verstärkt aber das Korn und erhöht die Farbsättigung deutlich.', 'Farbstiche mild halten, Weißabgleich nicht zu neutral setzen – die Filmcharakteristik lebt von ihrem Farb-Punch. Schatten mit Vorsicht aufhellen, da Korn dann hervortritt.', '../img/packshots-vintage/lomography-800.webp', '', true, 'Kein lokales Factsheet; Belichtungsspielraum nicht belastbar aus Herstellerdaten belegt.', true, '2026-05-11T15:54:46.825409+00:00', '2026-05-11T15:54:46.825409+00:00')
on conflict (id) do update
set brand = excluded.brand,
  name = excluded.name,
  film_type = excluded.film_type,
  process = excluded.process,
  iso_box = excluded.iso_box,
  formats = excluded.formats,
  use_cases = excluded.use_cases,
  grain = excluded.grain,
  saturation = excluded.saturation,
  tone = excluded.tone,
  contrast = excluded.contrast,
  look_description = excluded.look_description,
  price_level = excluded.price_level,
  exposure_latitude = excluded.exposure_latitude,
  exposure_note = excluded.exposure_note,
  short_description = excluded.short_description,
  tip_exposure = excluded.tip_exposure,
  tip_development = excluded.tip_development,
  tip_scan = excluded.tip_scan,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  review_needed = excluded.review_needed,
  notes = excluded.notes,
  active = excluded.active,
  updated_at = excluded.updated_at;
