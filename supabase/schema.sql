-- Schema realmente applicato al progetto Supabase collegato via MCP
-- (migrazione "create_richieste_allegati_schema" + bucket "allegati-clienti").
-- Questo file è un riferimento a scopo documentale: NON eseguirlo di nuovo
-- sul progetto già configurato (le tabelle esistono già).
--
-- Migrazione successiva "richieste_budget_numeric": la colonna "budget" è
-- passata da text a numeric(10,2) (tabella vuota al momento della migrazione,
-- nessun dato perso).
--
-- Migrazione successiva "richieste_tipo_progetto_specifiche": aggiunte le
-- colonne "tipo_progetto" (text) e "specifiche_tecniche" (text[]).

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
  tipo_progetto text,
  -- Checkbox multiple, dipendenti dal tipo di progetto scelto (vedi il form
  -- pubblico per l'elenco delle opzioni per ciascun tipo). Array vuoto se
  -- nessuna specifica è stata selezionata, non null.
  specifiche_tecniche text[],
  budget numeric(10,2),
  -- Testo leggibile: una data "gg/mm/aaaa" (es. "20/08/2026") oppure "Flessibile".
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

-- Migrazione successiva "reassert_anon_insert_policies_and_add_authenticated":
-- oltre a riaffermare (drop+recreate) le due policy "anon" sopra, sono state
-- aggiunte le stesse policy anche per "authenticated". Motivo: se chi compila
-- il form pubblico ha ANCHE una sessione admin attiva nello stesso browser
-- (stessi cookie sul dominio), il client Supabase lato browser invia le
-- richieste come ruolo "authenticated", non "anon". Senza questa policy,
-- l'insert falliva con "new row violates row-level security policy" pur
-- essendo la policy anon perfettamente funzionante.
create policy "Autenticati possono inserire richieste"
on richieste for insert
to authenticated
with check (true);

create policy "Autenticati possono inserire allegati"
on allegati for insert
to authenticated
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
using (true)
with check (true);

create policy "Solo autenticati eliminano richieste"
on richieste for delete
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

-- Policy aggiunta per permettere agli utenti autenticati di rigenerare signed URL
-- dalla dashboard (necessaria per la pagina dettaglio richiesta).
create policy "Autenticati leggono allegati-clienti per signed url"
on storage.objects for select
to authenticated
using (bucket_id = 'allegati-clienti');

create policy "Autenticati eliminano allegati-clienti"
on storage.objects for delete
to authenticated
using (bucket_id = 'allegati-clienti');

-- Nota (get_advisors, livello WARN, non bloccante): le policy INSERT per "anon"
-- e UPDATE per "authenticated" usano WITH CHECK/USING (true) di proposito, dato
-- il modello previsto (form pubblico senza login + pannello admin a ruolo unico).

-- =============================================================================
-- Sezione "Preventivi" (migrazioni "create_preventivi_table" e
-- "create_preventivi_clienti_bucket_and_policies" + bucket "preventivi-clienti").
-- A differenza di "allegati", qui l'intero CRUD (insert/select/update/delete) è
-- riservato al ruolo "authenticated": i preventivi vengono caricati ed eliminati
-- solo dal pannello admin, mai dal form pubblico.
-- =============================================================================

create table preventivi (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  richiesta_id uuid references richieste(id) on delete cascade,
  -- Cliente diretto (sezione Preventivi): usati quando richiesta_id è null.
  nome text,
  cognome text,
  azienda text,
  -- Può essere generato automaticamente se non indicato dall'admin.
  numero_preventivo text,
  data_invio date not null,
  prezzo numeric(12, 2),
  stato text not null default 'inviato'
    check (stato in ('inviato', 'in_attesa', 'accettato', 'rifiutato', 'scaduto')),
  nome_file text not null,
  url_file text not null
);

alter table preventivi enable row level security;

create policy "Solo autenticati leggono preventivi"
on preventivi for select
to authenticated
using (true);

create policy "Solo autenticati inseriscono preventivi"
on preventivi for insert
to authenticated
with check (true);

create policy "Solo autenticati aggiornano preventivi"
on preventivi for update
to authenticated
using (true);

create policy "Solo autenticati eliminano preventivi"
on preventivi for delete
to authenticated
using (true);

-- Bucket di storage privato per i PDF dei preventivi caricati dalla dashboard.
insert into storage.buckets (id, name, public)
values ('preventivi-clienti', 'preventivi-clienti', false);

create policy "Autenticati caricano preventivi-clienti"
on storage.objects for insert
to authenticated
with check (bucket_id = 'preventivi-clienti');

create policy "Autenticati leggono preventivi-clienti"
on storage.objects for select
to authenticated
using (bucket_id = 'preventivi-clienti');

create policy "Autenticati eliminano preventivi-clienti"
on storage.objects for delete
to authenticated
using (bucket_id = 'preventivi-clienti');

-- =============================================================================
-- Sezione "Contabilità" (migrazione "create_contabilita_tables").
-- Nessun bucket di storage: sono solo dati tabellari, gestiti esclusivamente
-- dal pannello admin (ruolo "authenticated"), con policy "for all" perché non
-- c'è un ruolo pubblico coinvolto in questa sezione.
-- =============================================================================

create table movimenti (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  tipo text not null check (tipo in ('entrata', 'uscita')),
  categoria text not null check (categoria in ('vendita_app', 'abbonamento_software', 'prontopro', 'pubblicita_ads', 'lavoro_esterno', 'attrezzatura', 'staff', 'altro')),
  descrizione text not null,
  importo numeric(10,2) not null,
  data date not null,
  richiesta_id uuid references richieste(id) on delete set null,
  note text
);

create table abbonamenti (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  nome text not null,
  costo_mensile numeric(10,2) not null,
  categoria text,
  attivo boolean default true,
  data_inizio date,
  note text
);

alter table movimenti enable row level security;
alter table abbonamenti enable row level security;

create policy "Solo autenticati gestiscono movimenti"
on movimenti for all
to authenticated
using (true)
with check (true);

create policy "Solo autenticati gestiscono abbonamenti"
on abbonamenti for all
to authenticated
using (true)
with check (true);
