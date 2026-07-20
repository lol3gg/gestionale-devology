-- Aggiunge prezzo e stato ai preventivi.
-- Esegui in Supabase → SQL Editor se le colonne non esistono ancora.

alter table preventivi
  add column if not exists prezzo numeric(12, 2),
  add column if not exists stato text not null default 'inviato';

alter table preventivi
  drop constraint if exists preventivi_stato_check;

alter table preventivi
  add constraint preventivi_stato_check
  check (stato in ('inviato', 'in_attesa', 'accettato', 'rifiutato', 'scaduto'));

comment on column preventivi.prezzo is 'Importo del preventivo in euro';
comment on column preventivi.stato is 'Stato commerciale: inviato, in_attesa, accettato, rifiutato, scaduto';
