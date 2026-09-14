export const SETUP_PORTALE_COLLABORATORI_SQL = `-- Portale collaboratori: esegui questo script una volta in Supabase → SQL Editor
-- Progetto: bjiqxqjlnkzjwqisljla

create extension if not exists pgcrypto;

alter table public.collaboratori
  add column if not exists token text;

alter table public.collaboratori
  add column if not exists link_attivo boolean not null default true;

update public.collaboratori
set token = encode(gen_random_bytes(16), 'hex')
where token is null or length(trim(token)) < 24;

alter table public.collaboratori
  alter column token set not null;

create unique index if not exists collaboratori_token_unique
  on public.collaboratori (token);

create or replace function public.collaboratori_ensure_token()
returns trigger
language plpgsql
as $$
begin
  if new.token is null or length(trim(new.token)) < 24 then
    new.token := encode(gen_random_bytes(16), 'hex');
  end if;
  if new.link_attivo is null then
    new.link_attivo := true;
  end if;
  return new;
end;
$$;

drop trigger if exists collaboratori_ensure_token_bi on public.collaboratori;
create trigger collaboratori_ensure_token_bi
before insert or update on public.collaboratori
for each row
execute procedure public.collaboratori_ensure_token();

create table if not exists public.contatti_collaboratore (
  id uuid primary key default gen_random_uuid(),
  collaboratore_id uuid not null references public.collaboratori(id) on delete cascade,
  nome_azienda text,
  referente text,
  telefono text,
  email text,
  note text,
  stato text not null default 'da_chiamare'
    check (stato in (
      'da_chiamare',
      'chiamato',
      'da_richiamare',
      'call_fissata',
      'interessato',
      'non_interessato'
    )),
  data_richiamo timestamptz,
  data_call timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contatti_collaboratore_richiamo_check
    check (stato <> 'da_richiamare' or data_richiamo is not null),
  constraint contatti_collaboratore_call_check
    check (stato <> 'call_fissata' or data_call is not null)
);

create index if not exists contatti_collaboratore_collaboratore_idx
  on public.contatti_collaboratore (collaboratore_id);

create index if not exists contatti_collaboratore_stato_idx
  on public.contatti_collaboratore (collaboratore_id, stato);

create index if not exists contatti_collaboratore_data_call_idx
  on public.contatti_collaboratore (data_call)
  where stato = 'call_fissata';

create or replace function public.contatti_collaboratore_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contatti_collaboratore_set_updated_at on public.contatti_collaboratore;
create trigger contatti_collaboratore_set_updated_at
before update on public.contatti_collaboratore
for each row
execute procedure public.contatti_collaboratore_set_updated_at();

alter table public.contatti_collaboratore enable row level security;

revoke all on public.contatti_collaboratore from anon, public;
grant select, insert, update, delete on public.contatti_collaboratore to authenticated;
grant all on public.contatti_collaboratore to service_role;

drop policy if exists "Solo autenticati gestiscono contatti_collaboratore" on public.contatti_collaboratore;
create policy "Solo autenticati gestiscono contatti_collaboratore"
on public.contatti_collaboratore for all
to authenticated
using (true)
with check (true);
`;
