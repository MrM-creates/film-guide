-- FilmGuide Supabase setup
-- Run this in the Supabase SQL editor of the project you want to use.

create extension if not exists pgcrypto;

create table if not exists public.films (
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

create index if not exists films_brand_name_idx on public.films (brand, name);
create index if not exists films_active_idx on public.films (active);

grant usage on schema public to anon, authenticated;
grant select on public.films to anon;
grant select, insert, update, delete on public.films to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists films_set_updated_at on public.films;
create trigger films_set_updated_at
before update on public.films
for each row
execute function public.set_updated_at();

alter table public.films enable row level security;

drop policy if exists "Films are readable by everyone" on public.films;
create policy "Films are readable by everyone"
on public.films for select
using (true);

drop policy if exists "Authenticated users can insert films" on public.films;
create policy "Authenticated users can insert films"
on public.films for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update films" on public.films;
create policy "Authenticated users can update films"
on public.films for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete films" on public.films;
create policy "Authenticated users can delete films"
on public.films for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('film-packshots', 'film-packshots', true, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Film packshots are publicly readable" on storage.objects;
create policy "Film packshots are publicly readable"
on storage.objects for select
using (bucket_id = 'film-packshots');

drop policy if exists "Authenticated users can upload film packshots" on storage.objects;
create policy "Authenticated users can upload film packshots"
on storage.objects for insert
to authenticated
with check (bucket_id = 'film-packshots');

drop policy if exists "Authenticated users can update film packshots" on storage.objects;
create policy "Authenticated users can update film packshots"
on storage.objects for update
to authenticated
using (bucket_id = 'film-packshots')
with check (bucket_id = 'film-packshots');

drop policy if exists "Authenticated users can delete film packshots" on storage.objects;
create policy "Authenticated users can delete film packshots"
on storage.objects for delete
to authenticated
using (bucket_id = 'film-packshots');
