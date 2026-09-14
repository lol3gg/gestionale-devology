-- Sezione Collaboratori: aziende, freelancer e persone con percentuale
-- sui preventivi chiusi e importi da pagare.
-- Esegui in Supabase → SQL Editor se le tabelle non esistono ancora.

create table if not exists public.collaboratori (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  nome text not null,
  tipo text not null check (tipo in ('azienda', 'freelancer', 'persona')),
  contatto text,
  iban text,
  percentuale numeric(5,2) not null default 0
    check (percentuale >= 0 and percentuale <= 100),
  note text,
  attivo boolean not null default true
);

create table if not exists public.collaboratore_lavori (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  collaboratore_id uuid not null references public.collaboratori(id) on delete cascade,
  preventivo_id uuid references public.preventivi(id) on delete set null,
  cliente text,
  descrizione text,
  prezzo numeric(12,2) not null,
  percentuale numeric(5,2) not null
    check (percentuale >= 0 and percentuale <= 100),
  importo_pagato numeric(12,2) not null default 0
    check (importo_pagato >= 0),
  data date not null default current_date,
  note text
);

create unique index if not exists collaboratore_lavori_unique_preventivo
  on public.collaboratore_lavori (collaboratore_id, preventivo_id)
  where preventivo_id is not null;

create index if not exists collaboratore_lavori_collaboratore_idx
  on public.collaboratore_lavori (collaboratore_id);

alter table public.collaboratori enable row level security;
alter table public.collaboratore_lavori enable row level security;

drop policy if exists "Solo autenticati gestiscono collaboratori" on public.collaboratori;
create policy "Solo autenticati gestiscono collaboratori"
on public.collaboratori for all
to authenticated
using (true)
with check (true);

drop policy if exists "Solo autenticati gestiscono collaboratore_lavori" on public.collaboratore_lavori;
create policy "Solo autenticati gestiscono collaboratore_lavori"
on public.collaboratore_lavori for all
to authenticated
using (true)
with check (true);
