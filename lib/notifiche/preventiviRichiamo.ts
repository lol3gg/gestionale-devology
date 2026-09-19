import type { SupabaseClient } from "@supabase/supabase-js";
import { addGiorni, oggiIsoRoma } from "@/lib/calendario/date";
import { GIORNI_RICHIAMO_PREVENTIVO } from "@/lib/preventivi/richiamo";
import { STATI_PREVENTIVO_ATTIVI } from "@/lib/preventivi/stato";
import type { NotificaMattinaPayload } from "./types";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "notifiche/preventivi-richiami.json";

export type PreventivoDaRichiamare = {
  id: string;
  etichetta: string;
  data_invio: string;
};

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

function etichettaCliente(row: {
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  numero_preventivo: string | null;
}) {
  const persona = `${row.nome ?? ""} ${row.cognome ?? ""}`.trim();
  if (persona && row.azienda) return `${persona} · ${row.azienda}`;
  if (persona) return persona;
  if (row.azienda) return row.azienda;
  return row.numero_preventivo || "Preventivo";
}

async function loadInviati(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return [];
    throw new Error(`Impossibile leggere i richiami preventivo: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { ids?: string[] };
    return Array.isArray(parsed.ids) ? parsed.ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

async function saveInviati(supabase: SupabaseClient, ids: string[]) {
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(JSON.stringify({ ids }), "utf-8"),
    { contentType: "application/json", upsert: true }
  );
  if (error) {
    throw new Error(`Impossibile salvare i richiami preventivo: ${error.message}`);
  }
}

export async function listPreventiviDaRicontattare(
  supabase: SupabaseClient
): Promise<PreventivoDaRichiamare[]> {
  const oggi = oggiIsoRoma();
  const limite = addGiorni(oggi, -GIORNI_RICHIAMO_PREVENTIVO);
  const giaInviati = new Set(await loadInviati(supabase));

  const { data, error } = await supabase
    .from("preventivi")
    .select("id, data_invio, nome, cognome, azienda, numero_preventivo, stato, richiesta_id")
    .in("stato", STATI_PREVENTIVO_ATTIVI)
    .lte("data_invio", limite)
    .order("data_invio", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).filter((row) => !giaInviati.has(row.id));
  const richiestaIds = Array.from(
    new Set(rows.map((row) => row.richiesta_id).filter((id): id is string => Boolean(id)))
  );

  const richiestaById = new Map<string, { nome: string; cognome: string; nome_azienda: string | null }>();
  if (richiestaIds.length > 0) {
    const richieste = await supabase
      .from("richieste")
      .select("id, nome, cognome, nome_azienda")
      .in("id", richiestaIds);
    for (const richiesta of richieste.data ?? []) {
      richiestaById.set(richiesta.id, richiesta);
    }
  }

  return rows.map((row) => {
    const richiesta = row.richiesta_id ? richiestaById.get(row.richiesta_id) : null;
    return {
      id: row.id,
      data_invio: String(row.data_invio).slice(0, 10),
      etichetta: etichettaCliente({
        nome: row.nome || richiesta?.nome || null,
        cognome: row.cognome || richiesta?.cognome || null,
        azienda: row.azienda || richiesta?.nome_azienda || null,
        numero_preventivo: row.numero_preventivo,
      }),
    };
  });
}

export function buildPayloadRichiamoPreventivi(
  items: PreventivoDaRichiamare[]
): NotificaMattinaPayload | null {
  if (items.length === 0) return null;
  const oggi = oggiIsoRoma();
  const elenco = items.map((item) => item.etichetta).join(" · ");
  if (items.length === 1) {
    return {
      title: "Ricontatta il cliente",
      body: `È passata una settimana dal preventivo a ${items[0].etichetta}.`,
      url: "/dashboard/preventivi",
      tag: `preventivo-richiamo-${oggi}`,
    };
  }
  return {
    title: `${items.length} preventivi da ricontattare`,
    body: (elenco.length > 180 ? `${elenco.slice(0, 177)}…` : elenco) || "È passata una settimana dall'invio.",
    url: "/dashboard/preventivi",
    tag: `preventivo-richiamo-${oggi}`,
  };
}

export async function marcaRichiamiInviati(supabase: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return;
  const current = await loadInviati(supabase);
  await saveInviati(supabase, Array.from(new Set([...current, ...ids])));
}
