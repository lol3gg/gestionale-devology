-- Calendario call: appuntamenti da 30 minuti con nome azienda
-- e contatti facoltativi. Esegui in Supabase → SQL Editor se manca la tabella.

create table if not exists public.call_appuntamenti (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  giorno date not null,
  ora time not null,
  azienda text not null,
  email text,
  telefono text,
  attivita text,
  constraint call_appuntamenti_slot_30
    check (extract(minute from ora) in (0, 30))
);

create unique index if not exists call_appuntamenti_slot_unique
  on public.call_appuntamenti (giorno, ora);

create index if not exists call_appuntamenti_giorno_idx
  on public.call_appuntamenti (giorno);

alter table public.call_appuntamenti enable row level security;

drop policy if exists "Solo autenticati gestiscono call_appuntamenti" on public.call_appuntamenti;
create policy "Solo autenticati gestiscono call_appuntamenti"
on public.call_appuntamenti for all
to authenticated
using (true)
with check (true);
