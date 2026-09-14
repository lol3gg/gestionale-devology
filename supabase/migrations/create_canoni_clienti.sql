-- Canoni mensili dei clienti (assistenza / sistema attivo).
create table if not exists public.canoni_clienti (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  nome text not null,
  tipo text not null default 'quota' check (tipo in ('quota', 'percentuale')),
  importo_mensile numeric(12,2) not null default 0,
  percentuale numeric(5,2),
  base_importo numeric(12,2),
  data_inizio date,
  attivo boolean not null default true,
  note text
);

alter table public.canoni_clienti enable row level security;

drop policy if exists "Solo autenticati gestiscono canoni_clienti" on public.canoni_clienti;
create policy "Solo autenticati gestiscono canoni_clienti"
on public.canoni_clienti for all
to authenticated
using (true)
with check (true);
