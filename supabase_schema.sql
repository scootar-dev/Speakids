-- ====================================================================
-- SKEMA DATABASE SUPABASE UNTUK SPEAKIDS
-- Salin dan jalankan skrip ini di:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. TABEL PROFIL SISWA
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default 'Teman',
  grade text not null default '1',
  stars integer not null default 0,
  audio_enabled boolean not null default true,
  speaking_badge boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABEL PROGRES BELAJAR PER KATEGORI (Alphabet, Vocabulary, Daily Expressions, Simple Sentences)
create table if not exists public.student_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id integer not null, -- 0: Alphabet, 1: Vocabulary, 2: Daily, 3: Sentences
  completed_level integer not null default 0,
  missions jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, category_id)
);

-- 3. TABEL RIWAYAT BELAJAR & PERMAINAN
create table if not exists public.learning_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  note text not null,
  stars_earned integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- KEAMANAN / ROW LEVEL SECURITY (RLS)
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.student_progress enable row level security;
alter table public.learning_history enable row level security;

-- Policy Profiles: Semua siswa bisa melihat daftar nama & bintang (Leaderboard)
drop policy if exists "Profil dapat dibaca oleh publik (Leaderboard)" on public.profiles;
create policy "Profil dapat dibaca oleh publik (Leaderboard)"
  on public.profiles for select
  using (true);

drop policy if exists "Pengguna hanya bisa memperbarui profilnya sendiri" on public.profiles;
create policy "Pengguna hanya bisa memperbarui profilnya sendiri"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Pengguna hanya bisa menambah profilnya sendiri" on public.profiles;
create policy "Pengguna hanya bisa menambah profilnya sendiri"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Policy Student Progress: Siswa hanya dapat membaca & mengubah progres miliknya
drop policy if exists "Pengguna bisa membaca progresnya sendiri" on public.student_progress;
create policy "Pengguna bisa membaca progresnya sendiri"
  on public.student_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Pengguna bisa menambah progresnya sendiri" on public.student_progress;
create policy "Pengguna bisa menambah progresnya sendiri"
  on public.student_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Pengguna bisa memperbarui progresnya sendiri" on public.student_progress;
create policy "Pengguna bisa memperbarui progresnya sendiri"
  on public.student_progress for update
  using (auth.uid() = user_id);

-- Policy Learning History: Siswa hanya dapat membaca & menambah riwayat miliknya
drop policy if exists "Pengguna bisa membaca riwayatnya sendiri" on public.learning_history;
create policy "Pengguna bisa membaca riwayatnya sendiri"
  on public.learning_history for select
  using (auth.uid() = user_id);

drop policy if exists "Pengguna bisa menambah riwayatnya sendiri" on public.learning_history;
create policy "Pengguna bisa menambah riwayatnya sendiri"
  on public.learning_history for insert
  with check (auth.uid() = user_id);

-- ====================================================================
-- OTOMATIS MEMBUAT PROFIL SAAT SISWA MENDAFTAR (AUTH TRIGGER)
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, grade)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Teman Piko'),
    coalesce(new.raw_user_meta_data->>'grade', '1')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Pasang trigger ke tabel auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- View untuk Peringkat Siswa Teratas (Leaderboard)
create or replace view public.leaderboard as
  select name, grade, stars
  from public.profiles
  order by stars desc
   limit 50;

-- Migration: rerunnable; legacy history receives a stable id on next sync.
alter table public.learning_history add column if not exists event_id text;
create unique index if not exists learning_history_event_unique
  on public.learning_history(user_id, event_id);

create or replace function public.speakids_snapshot()
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object('name', name, 'grade', grade, 'stars', stars,
    'audio', audio_enabled, 'speaking', speaking_badge) into result
    from profiles where id = auth.uid();
  if result is null then raise exception 'Profile missing'; end if;
  return result || jsonb_build_object(
    'done', (select jsonb_agg(coalesce(p.completed_level,0) order by c)
      from generate_series(0,3) c left join student_progress p
      on p.category_id=c and p.user_id=auth.uid()),
    'missions', coalesce((select jsonb_object_agg(m.key,m.value)
      from student_progress p cross join lateral jsonb_each(p.missions) m
      where p.user_id=auth.uid()), '{}'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('id',coalesce(h.event_id,h.id::text),
      'title',h.title,'note',h.note,'time',h.created_at) order by h.created_at desc)
      from (select * from learning_history where user_id=auth.uid() order by created_at desc limit 100) h), '[]'::jsonb));
end $$;

create or replace function public.speakids_sync(payload jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare cat integer; completed integer; incoming jsonb; existing jsonb; merged jsonb; item record; event jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  -- Serialize writes for this student. Maxima preserve progress from another device.
  perform 1 from profiles where id=auth.uid() for update;
  if not found then raise exception 'Profile missing'; end if;
  update profiles set name=left(coalesce(payload->>'name',name),20),
    grade=coalesce(payload->>'grade',grade), stars=greatest(stars,coalesce((payload->>'stars')::integer,0)),
    audio_enabled=coalesce((payload->>'audio')::boolean,audio_enabled),
    speaking_badge=speaking_badge or coalesce((payload->>'speaking')::boolean,false), updated_at=now()
    where id=auth.uid();
  for cat in 0..3 loop
    select missions, completed_level into existing, completed from student_progress where user_id=auth.uid() and category_id=cat;
    completed := greatest(coalesce(completed,0),least(5,greatest(0,coalesce((payload->'done'->>cat)::integer,0))));
    merged := coalesce(existing,'{}'::jsonb);
    for item in select key,value from jsonb_each(coalesce(payload->'missions','{}'::jsonb)) loop
      if item.key like cat::text || '-%' then
        incoming := merged->item.key;
        if incoming is null or
          (coalesce((item.value->>'stage')::int,0),coalesce((item.value->>'final')::int,0),coalesce((item.value->>'card')::int,0)) >=
          (coalesce((incoming->>'stage')::int,0),coalesce((incoming->>'final')::int,0),coalesce((incoming->>'card')::int,0)) then
          merged := jsonb_set(merged,array[item.key],item.value);
        end if;
      end if;
    end loop;
    for item in select key from jsonb_each(merged) loop
      if item.key ~ '^[0-3]-[0-4]$' and split_part(item.key,'-',2)::int < completed then merged := merged - item.key; end if;
    end loop;
    insert into student_progress(user_id,category_id,completed_level,missions)
      values(auth.uid(),cat,completed,merged)
      on conflict(user_id,category_id) do update set completed_level=excluded.completed_level,missions=excluded.missions,updated_at=now();
  end loop;
  for event in select value from jsonb_array_elements(coalesce(payload->'history','[]'::jsonb)) loop
    insert into learning_history(user_id,event_id,title,note,created_at)
      select auth.uid(),event->>'id',event->>'title',event->>'note',(event->>'time')::timestamptz
      where not exists(select 1 from learning_history where user_id=auth.uid()
        and title=event->>'title' and note=event->>'note' and created_at=(event->>'time')::timestamptz)
      on conflict(user_id,event_id) do nothing;
  end loop;
  return public.speakids_snapshot();
end $$;
revoke all on function public.speakids_snapshot() from public, anon;
revoke all on function public.speakids_sync(jsonb) from public, anon;
grant execute on function public.speakids_snapshot() to authenticated;
grant execute on function public.speakids_sync(jsonb) to authenticated;
