-- Run after supabase_schema.sql. Admin membership is assigned only via SQL Editor.
create table if not exists public.content_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.content_admins enable row level security;
drop policy if exists admin_self on public.content_admins;
create policy admin_self on public.content_admins for select to authenticated using(user_id=auth.uid());
grant select on public.content_admins to authenticated;
revoke insert,update,delete on public.content_admins from anon,authenticated;

create table if not exists public.learning_levels (
  category_id integer not null check(category_id between 0 and 3),
  level_index integer not null check(level_index between 0 and 4),
  title text not null check(length(trim(title)) between 1 and 100),
  items jsonb not null default '[]',
  published boolean not null default false,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key(category_id,level_index),
  check(jsonb_typeof(items)='array' and jsonb_array_length(items)<=100)
);
alter table public.learning_levels enable row level security;
drop policy if exists read_levels on public.learning_levels;
create policy read_levels on public.learning_levels for select to anon,authenticated using(true);
grant select on public.learning_levels to anon,authenticated;
-- Public rows include disabled levels so clients never resurrect deleted built-in content.
-- Disabled rows contain no items. Draft editing stays in the admin form until saved.
revoke insert,update,delete on public.learning_levels from anon,authenticated;

create or replace function public.save_learning_level(c integer,l integer,t text,body jsonb,enabled boolean,expected_revision integer)
returns public.learning_levels language plpgsql security definer set search_path=public as $$
declare result public.learning_levels; item jsonb;
begin
  if not exists(select 1 from content_admins where user_id=auth.uid()) then raise exception 'Admin access required'; end if;
  if jsonb_typeof(body) is distinct from 'array' then raise exception 'Items must be an array'; end if;
  if enabled and jsonb_array_length(body)<3 then raise exception 'Minimal 3 kartu untuk menerbitkan level'; end if;
  for item in select value from jsonb_array_elements(body) loop
    if length(trim(coalesce(item->>'en','')))=0 or length(coalesce(item->>'en',''))>160
      or length(trim(coalesce(item->>'id','')))=0 or length(coalesce(item->>'id',''))>200
      or length(coalesce(item->>'pic',''))>20 then raise exception 'Materi tidak valid'; end if;
    if c=0 and coalesce(item->>'letter','') !~ '^[A-Z]$' then raise exception 'Huruf wajib A-Z'; end if;
  end loop;
  if (select count(*) from jsonb_array_elements(body)) <> (select count(distinct case when c=0 then value->>'letter' else value->>'en' end) from jsonb_array_elements(body)) then raise exception 'Materi duplikat'; end if;
  if expected_revision=0 then
    insert into learning_levels(category_id,level_index,title,items,published)
    values(c,l,t,case when enabled then body else '[]'::jsonb end,enabled) returning * into result;
  else
    update learning_levels set title=t,items=case when enabled then body else '[]'::jsonb end,
      published=enabled,revision=revision+1,updated_at=now()
      where category_id=c and level_index=l and revision=expected_revision returning * into result;
    if not found then raise exception 'Materi berubah di perangkat lain. Muat ulang sebelum menyimpan.'; end if;
  end if;
  return result;
end $$;
revoke all on function public.save_learning_level(integer,integer,text,jsonb,boolean,integer) from public,anon;
grant execute on function public.save_learning_level(integer,integer,text,jsonb,boolean,integer) to authenticated;

-- After creating an admin user in Authentication > Users, run with their UUID:
-- insert into public.content_admins(user_id) values ('ADMIN_USER_UUID') on conflict do nothing;
