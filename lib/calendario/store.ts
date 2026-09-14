import type { SupabaseClient } from "@supabase/supabase-js";
import {
  durataCall,
  intervalliSiSovrappongono,
  normalizzaOra,
  oraToMinuti,
} from "@/lib/calendario/date";
import type { CallAppuntamento, CallAppuntamentoInput } from "@/lib/calendario/types";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "calendario/appuntamenti.json";

export type CallActionResult = { ok: true } | { ok: false; error: string };

function isMissingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    /schema cache|does not exist|call_appuntamenti|durata_minuti|column/i.test(error.message ?? "")
  );
}

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

function mapRow(row: {
  id: string;
  giorno: string;
  ora: string;
  durataMinuti?: number;
  durata_minuti?: number;
  azienda: string;
  email: string | null;
  telefono: string | null;
  attivita: string | null;
}): CallAppuntamento {
  return {
    id: row.id,
    giorno: String(row.giorno).slice(0, 10),
    ora: normalizzaOra(String(row.ora ?? "")),
    durataMinuti: durataCall(row.durataMinuti ?? row.durata_minuti),
    azienda: row.azienda,
    email: row.email,
    telefono: row.telefono,
    attivita: row.attivita,
  };
}

function siSovrappone(
  calls: CallAppuntamento[],
  giorno: string,
  ora: string,
  durataMinuti: number,
  excludeId?: string
) {
  const start = oraToMinuti(ora);
  const durata = durataCall(durataMinuti);
  return calls.some((call) => {
    if (call.id === excludeId || call.giorno !== giorno) return false;
    return intervalliSiSovrappongono(start, durata, oraToMinuti(call.ora), durataCall(call.durataMinuti));
  });
}

async function loadFromStorage(supabase: SupabaseClient): Promise<CallAppuntamento[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return [];
    throw new Error(`Impossibile leggere il calendario: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { calls?: CallAppuntamento[] };
    return Array.isArray(parsed.calls) ? parsed.calls.map(mapRow) : [];
  } catch {
    return [];
  }
}

async function saveToStorage(supabase: SupabaseClient, calls: CallAppuntamento[]) {
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const payload = JSON.stringify({ calls });
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(payload, "utf-8"),
    {
      contentType: "application/json",
      upsert: true,
    }
  );
  if (error) {
    throw new Error(`Impossibile salvare il calendario: ${error.message}`);
  }
}

export async function listCalls(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<{ calls: CallAppuntamento[]; error: string | null; missingTable: boolean }> {
  const { data, error } = await supabase
    .from("call_appuntamenti")
    .select("id, giorno, ora, durata_minuti, azienda, email, telefono, attivita")
    .gte("giorno", from)
    .lte("giorno", to)
    .order("giorno", { ascending: true })
    .order("ora", { ascending: true });

  if (!error) {
    return { calls: (data ?? []).map(mapRow), error: null, missingTable: false };
  }

  if (!isMissingTable(error)) {
    return { calls: [], error: error.message, missingTable: false };
  }

  try {
    const stored = await loadFromStorage(supabase);
    const calls = stored
      .filter((call) => call.giorno >= from && call.giorno <= to)
      .sort((a, b) => a.giorno.localeCompare(b.giorno) || a.ora.localeCompare(b.ora));
    return { calls, error: null, missingTable: true };
  } catch (storageError) {
    return {
      calls: [],
      error: storageError instanceof Error ? storageError.message : "Errore nel calendario.",
      missingTable: true,
    };
  }
}

function toRow(input: CallAppuntamentoInput) {
  return {
    giorno: input.giorno,
    ora: input.ora,
    durataMinuti: durataCall(input.durataMinuti),
    azienda: input.azienda,
    email: input.email,
    telefono: input.telefono,
    attivita: input.attivita,
  };
}

export async function insertCall(
  supabase: SupabaseClient,
  input: CallAppuntamentoInput
): Promise<CallActionResult> {
  const row = toRow(input);
  const { error } = await supabase.from("call_appuntamenti").insert({
    giorno: row.giorno,
    ora: row.ora,
    durata_minuti: row.durataMinuti,
    azienda: row.azienda,
    email: row.email,
    telefono: row.telefono,
    attivita: row.attivita,
  });
  if (!error) return { ok: true };
  if (!isMissingTable(error)) {
    if (error.code === "23505") return { ok: false, error: "Questo orario è già occupato da un'altra call." };
    return { ok: false, error: `Impossibile fissare la call: ${error.message}` };
  }

  try {
    const calls = await loadFromStorage(supabase);
    if (siSovrappone(calls, row.giorno, row.ora, row.durataMinuti)) {
      return { ok: false, error: "Questo orario è già occupato da un'altra call." };
    }
    calls.push({
      id: crypto.randomUUID(),
      ...row,
    });
    await saveToStorage(supabase, calls);
    return { ok: true };
  } catch (storageError) {
    return {
      ok: false,
      error: storageError instanceof Error ? storageError.message : "Impossibile fissare la call.",
    };
  }
}

export async function patchCall(
  supabase: SupabaseClient,
  id: string,
  input: CallAppuntamentoInput
): Promise<CallActionResult> {
  const row = toRow(input);
  const { data, error } = await supabase
    .from("call_appuntamenti")
    .update({
      giorno: row.giorno,
      ora: row.ora,
      durata_minuti: row.durataMinuti,
      azienda: row.azienda,
      email: row.email,
      telefono: row.telefono,
      attivita: row.attivita,
    })
    .eq("id", id)
    .select("id");
  if (!error && data && data.length > 0) return { ok: true };
  if (error && !isMissingTable(error)) {
    if (error.code === "23505") return { ok: false, error: "Questo orario è già occupato da un'altra call." };
    return { ok: false, error: `Impossibile aggiornare la call: ${error.message}` };
  }

  try {
    const calls = await loadFromStorage(supabase);
    const index = calls.findIndex((call) => call.id === id);
    if (index < 0) return { ok: false, error: "Call non trovata." };
    if (siSovrappone(calls, row.giorno, row.ora, row.durataMinuti, id)) {
      return { ok: false, error: "Questo orario è già occupato da un'altra call." };
    }
    calls[index] = { id, ...row };
    await saveToStorage(supabase, calls);
    return { ok: true };
  } catch (storageError) {
    return {
      ok: false,
      error: storageError instanceof Error ? storageError.message : "Impossibile aggiornare la call.",
    };
  }
}

export async function removeCall(supabase: SupabaseClient, id: string): Promise<CallActionResult> {
  const { data, error } = await supabase.from("call_appuntamenti").delete().eq("id", id).select("id");
  if (!error && data && data.length > 0) return { ok: true };
  if (error && !isMissingTable(error)) {
    return { ok: false, error: `Impossibile eliminare la call: ${error.message}` };
  }

  try {
    const calls = await loadFromStorage(supabase);
    await saveToStorage(
      supabase,
      calls.filter((call) => call.id !== id)
    );
    return { ok: true };
  } catch (storageError) {
    return {
      ok: false,
      error: storageError instanceof Error ? storageError.message : "Impossibile eliminare la call.",
    };
  }
}
