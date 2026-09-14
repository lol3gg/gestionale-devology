"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export const SETUP_CALL_SQL = `-- Calendario call: esegui questo script una volta in Supabase → SQL Editor

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
`;

export function SetupCalendarioNotice() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(SETUP_CALL_SQL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
      <p>
        Serve un passaggio unico su Supabase: apri{" "}
        <a
          href="https://supabase.com/dashboard/project/bjiqxqjlnkzjwqisljla/sql/new"
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          SQL Editor
        </a>
        , incolla lo script e clicca Run. Poi ricarica questa pagina.
      </p>
      <button
        type="button"
        onClick={copySql}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "SQL copiato" : "Copia script SQL"}
      </button>
    </div>
  );
}
