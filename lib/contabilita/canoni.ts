import type { SupabaseClient } from "@supabase/supabase-js";
import { contaMesiNelPeriodo } from "@/lib/contabilita/format";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "contabilita/canoni-clienti.json";

export type TipoCanone = "quota" | "percentuale";

export type CanoneCliente = {
  id: string;
  nome: string;
  tipo: TipoCanone;
  importo_mensile: number;
  percentuale: number | null;
  base_importo: number | null;
  data_inizio: string | null;
  attivo: boolean;
  note: string | null;
};

export type NuovoCanoneInput = {
  nome: string;
  tipo: TipoCanone;
  importo_mensile: number;
  percentuale: number | null;
  base_importo: number | null;
  data_inizio: string | null;
  note: string | null;
};

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

function isMissingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    /schema cache|does not exist|canoni_clienti/i.test(error.message ?? "")
  );
}

export function importoMensileCanone(canone: Pick<CanoneCliente, "tipo" | "importo_mensile" | "percentuale" | "base_importo">) {
  if (canone.tipo === "percentuale") {
    const base = Number(canone.base_importo ?? 0);
    const pct = Number(canone.percentuale ?? 0);
    return Math.round(((base * pct) / 100) * 100) / 100;
  }
  return Number(canone.importo_mensile);
}

function mapRow(row: Record<string, unknown>): CanoneCliente {
  return {
    id: String(row.id),
    nome: String(row.nome ?? ""),
    tipo: row.tipo === "percentuale" ? "percentuale" : "quota",
    importo_mensile: Number(row.importo_mensile ?? 0),
    percentuale: row.percentuale != null ? Number(row.percentuale) : null,
    base_importo: row.base_importo != null ? Number(row.base_importo) : null,
    data_inizio: row.data_inizio ? String(row.data_inizio).slice(0, 10) : null,
    attivo: row.attivo !== false,
    note: row.note != null ? String(row.note) : null,
  };
}

async function loadFromStorage(supabase: SupabaseClient): Promise<CanoneCliente[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return [];
    throw new Error(`Impossibile leggere i canoni: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { canoni?: CanoneCliente[] };
    return Array.isArray(parsed.canoni) ? parsed.canoni.map(mapRow) : [];
  } catch {
    return [];
  }
}

async function saveToStorage(supabase: SupabaseClient, canoni: CanoneCliente[]) {
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(JSON.stringify({ canoni }), "utf-8"),
    { contentType: "application/json", upsert: true }
  );
  if (error) {
    throw new Error(`Impossibile salvare i canoni: ${error.message}`);
  }
}

export async function listCanoni(supabase: SupabaseClient): Promise<CanoneCliente[]> {
  const { data, error } = await supabase
    .from("canoni_clienti")
    .select("id, nome, tipo, importo_mensile, percentuale, base_importo, data_inizio, attivo, note")
    .order("attivo", { ascending: false })
    .order("nome", { ascending: true });

  if (!error) return (data ?? []).map(mapRow);
  if (!isMissingTable(error)) throw new Error(error.message);
  return loadFromStorage(supabase);
}

export async function insertCanone(supabase: SupabaseClient, input: NuovoCanoneInput): Promise<void> {
  const row = {
    nome: input.nome,
    tipo: input.tipo,
    importo_mensile: input.importo_mensile,
    percentuale: input.percentuale,
    base_importo: input.base_importo,
    data_inizio: input.data_inizio,
    note: input.note,
    attivo: true,
  };

  const { error } = await supabase.from("canoni_clienti").insert(row);
  if (!error) return;
  if (!isMissingTable(error)) throw new Error(error.message);

  const canoni = await loadFromStorage(supabase);
  canoni.push({
    id: crypto.randomUUID(),
    ...row,
  });
  await saveToStorage(supabase, canoni);
}

export async function patchCanoneAttivo(supabase: SupabaseClient, id: string, attivo: boolean): Promise<void> {
  const { data, error } = await supabase.from("canoni_clienti").update({ attivo }).eq("id", id).select("id");
  if (!error && data && data.length > 0) return;
  if (error && !isMissingTable(error)) throw new Error(error.message);

  const canoni = await loadFromStorage(supabase);
  const index = canoni.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Canone non trovato.");
  canoni[index] = { ...canoni[index], attivo };
  await saveToStorage(supabase, canoni);
}

export async function removeCanone(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from("canoni_clienti").delete().eq("id", id).select("id");
  if (!error && data && data.length > 0) return;
  if (error && !isMissingTable(error)) throw new Error(error.message);

  const canoni = await loadFromStorage(supabase);
  await saveToStorage(
    supabase,
    canoni.filter((item) => item.id !== id)
  );
}

export function totaleCanoniNelPeriodo(
  canoni: CanoneCliente[],
  inizio: string,
  fine: string
) {
  return canoni
    .filter((canone) => canone.attivo)
    .reduce(
      (sum, canone) =>
        sum + importoMensileCanone(canone) * contaMesiNelPeriodo(canone.data_inizio, inizio, fine),
      0
    );
}

export function totaleCanoniMensile(canoni: CanoneCliente[]) {
  return canoni.filter((canone) => canone.attivo).reduce((sum, canone) => sum + importoMensileCanone(canone), 0);
}
