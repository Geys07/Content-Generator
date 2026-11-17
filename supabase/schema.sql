-- Jalankan satu kali di SQL Editor proyek Supabase milik Anda.
-- Buat akun pengguna melalui Supabase Auth sebelum login dari Ruang Adegan.
create table if not exists public.video_projects (
 id uuid primary key,
 owner_id uuid not null references auth.users(id),
 title text not null,
 data jsonb not null,
 revision integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.video_projects enable row level security;
grant select, insert, update on public.video_projects to authenticated;
drop policy if exists "ruang_owner_projects" on public.video_projects;
create policy "ruang_owner_projects" on public.video_projects for all to authenticated
 using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
insert into storage.buckets(id,name,public,file_size_limit)
 values ('ruang-adegan','ruang-adegan',false,104857600)
 on conflict (id) do nothing;
drop policy if exists "ruang_private_media" on storage.objects;
create policy "ruang_private_media" on storage.objects for all to authenticated
 using (bucket_id='ruang-adegan' and (storage.foldername(name))[1]=(select auth.uid())::text)
 with check (bucket_id='ruang-adegan' and (storage.foldername(name))[1]=(select auth.uid())::text);

create index if not exists video_projects_owner_updated_idx on public.video_projects(owner_id,updated_at desc);
revoke all on public.video_projects from anon;
