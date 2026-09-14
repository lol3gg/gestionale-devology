import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizzaOra } from "@/lib/calendario/date";
import type { CallAppuntamento, CallAppuntamentoInput } from "@/lib/calendario/types";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "calendario/appuntamenti.json";

export type CallActionResult = { ok: true } | { ok: false; error: string };

function isMissingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    /schema cache|does not exist|call_appuntamenti/i.test(error.message ?? "")
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
  azienda: string;
  email: string | null;
  telefono: string | null;
  attivita: string | null;
}): CallAppuntamento {
  return {
    id: row.id,
    giorno: String(row.giorno).slice(0, 10),
    ora: normalizzaOra(String(row.ora ?? "")),
    azienda: row.azienda,
    email: row.email,
    telefono: row.telefono,
    attivita: row.attivita,
  };
}

function slotOccupato(calls: CallAppuntamento[], giorno: string, ora: string, excludeId?: string) {
  const target = normalizzaOra(ora);
  return calls.some(
    (call) => call.giorno === giorno && normalizzaOra(call.ora) === target && call.id !== excludeId
  );
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
    .select("id, giorno, ora, azienda, email, telefono, attivita")
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

export async function insertCall(
  supabase: SupabaseClient,
  input: CallAppuntamentoInput
): Promise<CallActionResult> {
  const row = {
    giorno: input.giorno,
    ora: input.ora,
    azienda: input.azienda,
    email: input.email,
    telefono: input.telefono,
    attivita: input.attivita,
  };

  const { error } = await supabase.from("call_appuntamenti").insert(row);
  if (!error) return { ok: true };
  if (!isMissingTable(error)) {
    if (error.code === "23505") return { ok: false, error: "C'è già una call in questo orario." };
    return { ok: false, error: `Impossibile fissare la call: ${error.message}` };
  }

  try {
    const calls = await loadFromStorage(supabase);
    if (slotOccupato(calls, input.giorno, input.ora)) {
      return { ok: false, error: "C'è già una call in questo orario." };
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
  const row = {
    giorno: input.giorno,
    ora: input.ora,
    azienda: input.azienda,
    email: input.email,
    telefono: input.telefono,
    attivita: input.attivita,
  };

  const { error } = await supabase.from("call_appuntamenti").update(row).eq("id", id);
  if (!error) return { ok: true };
  if (!isMissingTable(error)) {
    if (error.code === "23505") return { ok: false, error: "C'è già una call in questo orario." };
    return { ok: false, error: `Impossibile aggiornare la call: ${error.message}` };
  }

  try {
    const calls = await loadFromStorage(supabase);
    const index = calls.findIndex((call) => call.id === id);
    if (index < 0) return { ok: false, error: "Call non trovata." };
    if (slotOccupato(calls, input.giorno, input.ora, id)) {
      return { ok: false, error: "C'è già una call in questo orario." };
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
  const { error } = await supabase.from("call_appuntamenti").delete().eq("id", id);
  if (!error) return { ok: true };
  if (!isMissingTable(error)) {
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
