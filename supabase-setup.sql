-- Jalankan di Supabase Dashboard > SQL Editor.
create table if not exists public.love_content (
  id integer primary key check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('love-media', 'love-media', true)
on conflict (id) do update set public = true;

alter table public.love_content enable row level security;
drop policy if exists "Public can read love content" on public.love_content;
create policy "Public can read love content" on public.love_content for select using (true);
drop policy if exists "Public can manage love content" on public.love_content;
create policy "Public can manage love content" on public.love_content for all using (true) with check (true);

drop policy if exists "Public can read love media" on storage.objects;
create policy "Public can read love media" on storage.objects for select using (bucket_id = 'love-media');
drop policy if exists "Public can upload love media" on storage.objects;
create policy "Public can upload love media" on storage.objects for insert with check (bucket_id = 'love-media');
