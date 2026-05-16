-- FilmGuide factsheet source and proposal setup.
-- Run this after the base FilmGuide setup in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.filmguide_factsheet_sources (
  id uuid primary key default gen_random_uuid(),
  film_id text references public.filmguide_films(id) on delete set null,
  source_type text not null default 'text' check (source_type in ('pdf', 'url', 'text', 'repo')),
  source_name text not null default '',
  source_url text not null default '',
  storage_path text not null default '',
  extracted_text text not null default '',
  extraction_status text not null default 'ready' check (extraction_status in ('ready', 'failed', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filmguide_film_proposals (
  id uuid primary key default gen_random_uuid(),
  factsheet_source_id uuid references public.filmguide_factsheet_sources(id) on delete cascade,
  proposed_data jsonb not null default '{}'::jsonb,
  field_sources jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists filmguide_factsheet_sources_film_id_idx on public.filmguide_factsheet_sources (film_id);
create unique index if not exists filmguide_factsheet_sources_source_type_url_idx
on public.filmguide_factsheet_sources (source_type, source_url)
where source_url <> '';
create index if not exists filmguide_film_proposals_source_id_idx on public.filmguide_film_proposals (factsheet_source_id);
create index if not exists filmguide_film_proposals_status_idx on public.filmguide_film_proposals (status);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.filmguide_factsheet_sources to authenticated;
grant select, insert, update, delete on public.filmguide_film_proposals to authenticated;

drop trigger if exists filmguide_factsheet_sources_set_updated_at on public.filmguide_factsheet_sources;
create trigger filmguide_factsheet_sources_set_updated_at
before update on public.filmguide_factsheet_sources
for each row
execute function public.set_updated_at();

alter table public.filmguide_factsheet_sources enable row level security;
alter table public.filmguide_film_proposals enable row level security;

drop policy if exists "Authenticated users can manage FilmGuide factsheet sources" on public.filmguide_factsheet_sources;
create policy "Authenticated users can manage FilmGuide factsheet sources"
on public.filmguide_factsheet_sources for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage FilmGuide film proposals" on public.filmguide_film_proposals;
create policy "Authenticated users can manage FilmGuide film proposals"
on public.filmguide_film_proposals for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'filmguide-factsheets',
  'filmguide-factsheets',
  false,
  20971520,
  array['application/pdf', 'text/plain']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can read FilmGuide factsheets" on storage.objects;
create policy "Authenticated users can read FilmGuide factsheets"
on storage.objects for select
to authenticated
using (bucket_id = 'filmguide-factsheets');

drop policy if exists "Authenticated users can upload FilmGuide factsheets" on storage.objects;
create policy "Authenticated users can upload FilmGuide factsheets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'filmguide-factsheets');

drop policy if exists "Authenticated users can update FilmGuide factsheets" on storage.objects;
create policy "Authenticated users can update FilmGuide factsheets"
on storage.objects for update
to authenticated
using (bucket_id = 'filmguide-factsheets')
with check (bucket_id = 'filmguide-factsheets');

drop policy if exists "Authenticated users can delete FilmGuide factsheets" on storage.objects;
create policy "Authenticated users can delete FilmGuide factsheets"
on storage.objects for delete
to authenticated
using (bucket_id = 'filmguide-factsheets');
