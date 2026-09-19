import type { SupabaseClient } from "@supabase/supabase-js";
import { oggiIsoRoma } from "@/lib/calendario/date";
import {
  dataRichiamoIso,
  etichettaClientePreventivo,
  giorniDaInvio,
  isDaRicontattare,
} from "@/lib/preventivi/richiamo";
import { STATI_PREVENTIVO_ATTIVI } from "@/lib/preventivi/stato";
import type { NotificaMattinaPayload } from "./types";

export type PreventivoRichiamoItem = {
  id: string;
  etichetta: string;
  data_invio: string;
  data_richiamo: string;
  giorniDaInvio: number;
  urgente: boolean;
  href: string;
  telefono: string | null;
};

type PreventivoRow = {
  id: string;
  data_invio: string;
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  numero_preventivo: string | null;
  stato: string | null;
  richiesta_id: string | null;
};

function mapItems(
  rows: PreventivoRow[],
  richiestaById: Map<string, { nome: string; cognome: string; nome_azienda: string | null; telefono: string | null }>
): PreventivoRichiamoItem[] {
  const oggi = oggiIsoRoma();
  return rows
    .map((row) => {
      const richiesta = row.richiesta_id ? richiestaById.get(row.richiesta_id) : null;
      const dataInvio = String(row.data_invio).slice(0, 10);
      const giorni = giorniDaInvio(dataInvio, oggi);
      return {
        id: row.id,
        data_invio: dataInvio,
        data_richiamo: dataRichiamoIso(dataInvio),
        giorniDaInvio: giorni,
        urgente: isDaRicontattare(dataInvio, row.stato ?? "inviato", oggi),
        href: row.richiesta_id ? `/dashboard/${row.richiesta_id}` : "/dashboard/preventivi",
        telefono: richiesta?.telefono ?? null,
        etichetta: etichettaClientePreventivo({
          nome: row.nome || richiesta?.nome || null,
          cognome: row.cognome || richiesta?.cognome || null,
          azienda: row.azienda || richiesta?.nome_azienda || null,
          numero_preventivo: row.numero_preventivo,
        }),
      };
    })
    .sort((a, b) => {
      if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
      return a.data_richiamo.localeCompare(b.data_richiamo) || a.data_invio.localeCompare(b.data_invio);
    });
}

async function loadRichieste(
  supabase: SupabaseClient,
  ids: string[]
) {
  const richiestaById = new Map<
    string,
    { nome: string; cognome: string; nome_azienda: string | null; telefono: string | null }
  >();
  if (ids.length === 0) return richiestaById;
  const richieste = await supabase
    .from("richieste")
    .select("id, nome, cognome, nome_azienda, telefono")
    .in("id", ids);
  for (const richiesta of richieste.data ?? []) {
    richiestaById.set(richiesta.id, richiesta);
  }
  return richiestaById;
}

export async function listPreventiviRichiamo(
  supabase: SupabaseClient
): Promise<PreventivoRichiamoItem[]> {
  const selectLungo =
    "id, data_invio, nome, cognome, azienda, numero_preventivo, stato, richiesta_id";
  const { data, error } = await supabase
    .from("preventivi")
    .select(selectLungo)
    .in("stato", STATI_PREVENTIVO_ATTIVI)
    .order("data_invio", { ascending: true });

  let rows = (data ?? []) as PreventivoRow[];

  if (error) {
    const fallback = await supabase
      .from("preventivi")
      .select("id, data_invio, numero_preventivo, stato, richiesta_id")
      .in("stato", STATI_PREVENTIVO_ATTIVI)
      .order("data_invio", { ascending: true });
    if (fallback.error) throw new Error(fallback.error.message);
    rows = (fallback.data ?? []).map((row) => ({
      ...row,
      nome: null,
      cognome: null,
      azienda: null,
    }));
  }

  const richiestaIds = Array.from(
    new Set(rows.map((row) => row.richiesta_id).filter((id): id is string => Boolean(id)))
  );
  return mapItems(rows, await loadRichieste(supabase, richiestaIds));
}

export async function listPreventiviDaRicontattare(
  supabase: SupabaseClient
): Promise<PreventivoRichiamoItem[]> {
  const items = await listPreventiviRichiamo(supabase);
  return items.filter((item) => item.urgente);
}

export function buildPayloadRichiamoPreventivi(
  items: PreventivoRichiamoItem[]
): NotificaMattinaPayload | null {
  if (items.length === 0) return null;
  const oggi = oggiIsoRoma();
  const elenco = items.map((item) => item.etichetta).join(" · ");
  if (items.length === 1) {
    return {
      title: "Ricontatta il cliente",
      body: `È passata una settimana dal preventivo a ${items[0].etichetta}.`,
      url: "/dashboard",
      tag: `preventivo-richiamo-${oggi}`,
    };
  }
  return {
    title: `${items.length} preventivi da ricontattare`,
    body: (elenco.length > 180 ? `${elenco.slice(0, 177)}…` : elenco) || "È passata una settimana dall'invio.",
    url: "/dashboard",
    tag: `preventivo-richiamo-${oggi}`,
  };
}
