import { Banknote, CheckCircle2, Percent, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/contabilita/format";
import { riepilogoGlobale } from "@/lib/collaboratori/calcoli";
import type { Collaboratore, CollaboratoreLavoro, PreventivoOption, TipoCollaboratore } from "@/lib/collaboratori/types";
import { NuovoCollaboratoreForm } from "./_components/NuovoCollaboratoreForm";
import { CollaboratoriLista } from "./_components/CollaboratoriLista";
import { SetupCollaboratoriNotice } from "./_components/SetupCollaboratoriNotice";
import { ensureCollaboratoriTokens } from "@/lib/collaboratori/portale";
import { listContatti } from "@/lib/collaboratori/contattiStore";
import { demoContattiPer } from "@/lib/collaboratori/demoContatti";
import { riepilogoContatti } from "@/lib/collaboratori/types";

export const dynamic = "force-dynamic";

type PreventivoJoin = {
  id: string;
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  prezzo: number | null;
  stato: string;
  data_invio: string;
  numero_preventivo: string | null;
};

function isMissingCollaboratoriTable(message: string | undefined) {
  if (!message) return false;
  return /Could not find the table|relation [\"']?public\.collaboratori|collaboratore_lavori/i.test(message);
}

function isMissingPortaleColumns(message: string | undefined) {
  if (!message) return false;
  return /token|link_attivo|schema cache|column/i.test(message);
}

export default async function CollaboratoriPage() {
  const supabase = createClient();

  const [portaleSelect, { data: lavoriRows, error: lavoriError }, { data: preventiviRows, error: preventiviError }] =
    await Promise.all([
      supabase
        .from("collaboratori")
        .select("id, nome, tipo, contatto, iban, percentuale, note, attivo, token, link_attivo, created_at")
        .order("attivo", { ascending: false })
        .order("nome", { ascending: true }),
      supabase
        .from("collaboratore_lavori")
        .select(
          "id, collaboratore_id, preventivo_id, cliente, descrizione, prezzo, percentuale, importo_pagato, data, note, preventivi(id, nome, cognome, azienda, prezzo, stato, data_invio, numero_preventivo)"
        )
        .order("data", { ascending: false }),
      supabase
        .from("preventivi")
        .select("id, nome, cognome, azienda, prezzo, stato, data_invio, numero_preventivo")
        .order("data_invio", { ascending: false }),
    ]);

  let collaboratoriRows: Array<{
    id: string;
    nome: string;
    tipo: string;
    contatto: string | null;
    iban: string | null;
    percentuale: number;
    note: string | null;
    attivo: boolean;
    token?: string | null;
    link_attivo?: boolean;
  }> | null = portaleSelect.data;
  let collaboratoriError = portaleSelect.error;

  if (collaboratoriError && isMissingPortaleColumns(collaboratoriError.message)) {
    const fallback = await supabase
      .from("collaboratori")
      .select("id, nome, tipo, contatto, iban, percentuale, note, attivo, created_at")
      .order("attivo", { ascending: false })
      .order("nome", { ascending: true });
    collaboratoriRows = fallback.data;
    collaboratoriError = fallback.error;
  }

  const tokenMap = await ensureCollaboratoriTokens();
  const contattiEntries = await Promise.all(
    (collaboratoriRows ?? []).map(async (row) => {
      try {
        return [row.id, await listContatti(row.id)] as const;
      } catch {
        return [row.id, demoContattiPer(row.id)] as const;
      }
    })
  );
  const contattiPerCollaboratore = new Map(contattiEntries);
  const missingTables =
    isMissingCollaboratoriTable(collaboratoriError?.message) || isMissingCollaboratoriTable(lavoriError?.message);
  const error = collaboratoriError ?? lavoriError ?? preventiviError;

  const lavoriPerCollaboratore = new Map<string, CollaboratoreLavoro[]>();
  for (const row of lavoriRows ?? []) {
    const preventivoRaw = Array.isArray(row.preventivi) ? row.preventivi[0] : row.preventivi;
    const preventivo = (preventivoRaw as PreventivoJoin | null) ?? null;
    const lavoro: CollaboratoreLavoro = {
      id: row.id,
      collaboratore_id: row.collaboratore_id,
      preventivo_id: row.preventivo_id,
      cliente: row.cliente,
      descrizione: row.descrizione,
      prezzo: Number(row.prezzo),
      percentuale: Number(row.percentuale),
      importo_pagato: Number(row.importo_pagato),
      data: row.data,
      note: row.note,
      preventivo: preventivo
        ? {
            ...preventivo,
            prezzo: preventivo.prezzo != null ? Number(preventivo.prezzo) : null,
          }
        : null,
    };
    const list = lavoriPerCollaboratore.get(row.collaboratore_id) ?? [];
    list.push(lavoro);
    lavoriPerCollaboratore.set(row.collaboratore_id, list);
  }

  const collaboratori: Collaboratore[] = (collaboratoriRows ?? []).map((row) => {
    const stored = tokenMap.get(row.id);
    const tokenFromRow = "token" in row ? (row.token as string | null) : null;
    return {
      id: row.id,
      nome: row.nome,
      tipo: row.tipo as TipoCollaboratore,
      contatto: row.contatto,
      iban: row.iban,
      percentuale: Number(row.percentuale),
      note: row.note,
      attivo: row.attivo,
      token: tokenFromRow || stored?.token || null,
      link_attivo: stored?.link_attivo ?? ("link_attivo" in row ? Boolean(row.link_attivo) : true),
      lavori: lavoriPerCollaboratore.get(row.id) ?? [],
      statsContatti: riepilogoContatti(contattiPerCollaboratore.get(row.id) ?? []),
    };
  });

  const preventivi: PreventivoOption[] = (preventiviRows ?? []).map((row) => ({
    ...row,
    prezzo: row.prezzo != null ? Number(row.prezzo) : null,
  }));

  const totale = riepilogoGlobale(collaboratori);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Pannello Admin
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          Collaboratori
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Se un collaboratore ti chiude un progetto da 5.000 € e la sua percentuale è 20%, gli spettano 1.000 €.
          Tu indichi la %: il calcolo è automatico.
        </p>
      </div>

      {missingTables && <SetupCollaboratoriNotice />}
      {error && !missingTables && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento: {error.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <RiepilogoCard
          icon={Users}
          label="Collaboratori attivi"
          value={String(totale.attiviCount)}
          tone="neutral"
        />
        <RiepilogoCard
          icon={CheckCircle2}
          label="Preventivi chiusi"
          value={String(totale.chiusiCount)}
          tone="neutral"
        />
        <RiepilogoCard
          icon={Percent}
          label="Già pagato"
          value={formatEuro(totale.pagato)}
          tone="positive"
        />
        <RiepilogoCard
          icon={Banknote}
          label="Da mandare"
          value={formatEuro(totale.daMandare)}
          tone={totale.daMandare > 0 ? "warning" : "positive"}
        />
      </div>

      <NuovoCollaboratoreForm />
      <CollaboratoriLista collaboratori={collaboratori} preventivi={preventivi} />
    </div>
  );
}

function RiepilogoCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "neutral" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : "text-brand-text";
  const iconClass =
    tone === "positive"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300 ring-amber-500/25"
        : "bg-blue-500/15 text-blue-300 ring-blue-500/25";

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset sm:h-9 sm:w-9 ${iconClass}`}>
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
      </span>
      <p className={`mt-2.5 text-lg font-extrabold tracking-[-0.02em] sm:mt-3.5 sm:text-2xl ${toneClass}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium leading-snug text-brand-muted sm:text-xs">{label}</p>
    </div>
  );
}
