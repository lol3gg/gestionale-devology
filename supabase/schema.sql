-- Schema realmente applicato al progetto Supabase collegato via MCP
-- (migrazione "create_richieste_allegati_schema" + bucket "allegati-clienti").
-- Questo file è un riferimento a scopo documentale: NON eseguirlo di nuovo
-- sul progetto già configurato (le tabelle esistono già).

create table richieste (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  nome text not null,
  cognome text not null,
  email text not null,
  telefono text,
  tipo_cliente text not null check (tipo_cliente in ('azienda', 'privato')),
  nome_azienda text,
  partita_iva text,
  descrizione_progetto text not null,
  budget text,
  tempistiche text,
  come_conosciuto text,
  stato text default 'nuovo' check (stato in ('nuovo', 'in_valutazione', 'preventivo_inviato', 'accettato', 'rifiutato', 'archiviato')),
  note_interne text
);

-- Nota: niente colonna "percorso"/"tipo"/"dimensione". Il bucket è privato,
-- quindi "url_file" contiene il signed URL generato al momento dell'upload
-- (validità lunga, 10 anni, perché non può essere rigenerato senza il percorso).
create table allegati (
  id uuid primary key default gen_random_uuid(),
  richiesta_id uuid references richieste(id) on delete cascade,
  nome_file text not null,
  url_file text not null,
  created_at timestamp with time zone default now()
);

alter table richieste enable row level security;
alter table allegati enable row level security;

create policy "Chiunque puo inserire richieste"
on richieste for insert
to anon
with check (true);

create policy "Chiunque puo inserire allegati"
on allegati for insert
to anon
with check (true);

create policy "Solo autenticati leggono richieste"
on richieste for select
to authenticated
using (true);

create policy "Solo autenticati leggono allegati"
on allegati for select
to authenticated
using (true);

create policy "Solo autenticati aggiornano richieste"
on richieste for update
to authenticated
using (true);

-- Bucket di storage privato per gli allegati caricati dal form pubblico.
insert into storage.buckets (id, name, public)
values ('allegati-clienti', 'allegati-clienti', false);

-- Il bucket privato ha RLS attivo di default su storage.objects: senza queste
-- policy il form pubblico (ruolo anon) non potrebbe né caricare i file né
-- generare il signed URL subito dopo l'upload.
create policy "Anon carica allegati-clienti"
on storage.objects for insert
to anon
with check (bucket_id = 'allegati-clienti');

create policy "Anon legge allegati-clienti per signed url"
on storage.objects for select
to anon
using (bucket_id = 'allegati-clienti');

-- Nota (get_advisors, livello WARN, non bloccante): le policy INSERT per "anon"
-- e UPDATE per "authenticated" usano WITH CHECK/USING (true) di proposito, dato
-- il modello previsto (form pubblico senza login + pannello admin a ruolo unico).
