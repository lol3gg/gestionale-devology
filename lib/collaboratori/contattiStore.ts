import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";
import { demoContattiPer } from "./demoContatti";
import type { ContattoCollaboratore, StatoContatto } from "./types";
import { STATI_CONTATTO } from "./types";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "collaboratori/contatti.json";

export type ContattoInput = {
  nome_azienda: string | null;
  referente: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  stato: StatoContatto;
  data_richiamo: string | null;
  data_call: string | null;
};

function isMissingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    /schema cache|does not exist|contatti_collaboratore/i.test(error.message ?? "")
  );
}

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

export function portaleDb() {
  return hasServiceRoleKey() ? createServiceClient() : createClient();
}

function isStato(value: unknown): value is StatoContatto {
  return STATI_CONTATTO.includes(value as StatoContatto);
}

function mapRow(row: Record<string, unknown>): ContattoCollaboratore {
  return {
    id: String(row.id),
    collaboratore_id: String(row.collaboratore_id),
    nome_azienda: row.nome_azienda != null ? String(row.nome_azienda) : null,
    referente: row.referente != null ? String(row.referente) : null,
    telefono: row.telefono != null ? String(row.telefono) : null,
    email: row.email != null ? String(row.email) : null,
    note: row.note != null ? String(row.note) : null,
    stato: isStato(row.stato) ? row.stato : "da_chiamare",
    data_richiamo: row.data_richiamo ? String(row.data_richiamo) : null,
    data_call: row.data_call ? String(row.data_call) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function loadAllFromStorage(supabase: SupabaseClient): Promise<ContattoCollaboratore[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return [];
    throw new Error(`Impossibile leggere i contatti: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { contatti?: Record<string, unknown>[] };
    return Array.isArray(parsed.contatti) ? parsed.contatti.map(mapRow) : [];
  } catch {
    return [];
  }
}

async function saveAllToStorage(supabase: SupabaseClient, contatti: ContattoCollaboratore[]) {
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(JSON.stringify({ contatti }), "utf-8"),
    { contentType: "application/json", upsert: true }
  );
  if (error) {
    throw new Error(`Impossibile salvare i contatti: ${error.message}`);
  }
}

function sortContatti(contatti: ContattoCollaboratore[]) {
  return [...contatti].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
}

export async function listContatti(
  collaboratoreId: string,
  supabase: SupabaseClient = portaleDb()
): Promise<ContattoCollaboratore[]> {
  const { data, error } = await supabase
    .from("contatti_collaboratore")
    .select(
      "id, collaboratore_id, nome_azienda, referente, telefono, email, note, stato, data_richiamo, data_call, created_at, updated_at"
    )
    .eq("collaboratore_id", collaboratoreId)
    .order("updated_at", { ascending: false });

  if (!error) {
    const rows = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    if (rows.length > 0) return rows;
    return ensureDemoIfEmpty(collaboratoreId, supabase, []);
  }
  if (!isMissingTable(error)) {
    throw new Error(error.message);
  }

  try {
    const stored = (await loadAllFromStorage(supabase)).filter((item) => item.collaboratore_id === collaboratoreId);
    return ensureDemoIfEmpty(collaboratoreId, supabase, stored);
  } catch {
    return demoContattiPer(collaboratoreId);
  }
}

async function ensureDemoIfEmpty(
  collaboratoreId: string,
  supabase: SupabaseClient,
  current: ContattoCollaboratore[]
) {
  if (current.length > 0) return sortContatti(current);
  const demo = demoContattiPer(collaboratoreId);
  try {
    await persistMany(demo, supabase);
  } catch {
    // Senza service role il portale pubblico mostra comunque i dati di esempio.
  }
  return demo;
}

async function persistMany(contatti: ContattoCollaboratore[], supabase: SupabaseClient) {
  const { error } = await supabase.from("contatti_collaboratore").upsert(contatti);
  if (!error) return;
  if (!isMissingTable(error)) throw new Error(error.message);

  const all = await loadAllFromStorage(supabase);
  const ids = new Set(contatti.map((item) => item.id));
  const merged = [...all.filter((item) => !ids.has(item.id)), ...contatti];
  await saveAllToStorage(supabase, merged);
}

export async function listTuttiContatti(
  supabase: SupabaseClient = portaleDb()
): Promise<ContattoCollaboratore[]> {
  const { data, error } = await supabase
    .from("contatti_collaboratore")
    .select(
      "id, collaboratore_id, nome_azienda, referente, telefono, email, note, stato, data_richiamo, data_call, created_at, updated_at"
    )
    .order("data_call", { ascending: true });

  if (!error) return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  if (!isMissingTable(error)) throw new Error(error.message);
  try {
    return await loadAllFromStorage(supabase);
  } catch {
    return [];
  }
}

export async function insertContatto(
  collaboratoreId: string,
  input: ContattoInput,
  supabase: SupabaseClient = portaleDb()
): Promise<ContattoCollaboratore> {
  const now = new Date().toISOString();
  const row: ContattoCollaboratore = {
    id: crypto.randomUUID(),
    collaboratore_id: collaboratoreId,
    ...input,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from("contatti_collaboratore").insert(row);
  if (!error) return row;
  if (!isMissingTable(error)) throw new Error(error.message);

  const all = await loadAllFromStorage(supabase);
  all.push(row);
  await saveAllToStorage(supabase, all);
  return row;
}

export async function insertContattiBulk(
  collaboratoreId: string,
  inputs: ContattoInput[],
  supabase: SupabaseClient = portaleDb()
): Promise<ContattoCollaboratore[]> {
  const now = new Date().toISOString();
  const rows = inputs.map((input) => ({
    id: crypto.randomUUID(),
    collaboratore_id: collaboratoreId,
    ...input,
    created_at: now,
    updated_at: now,
  }));
  if (rows.length === 0) return [];

  const { error } = await supabase.from("contatti_collaboratore").insert(rows);
  if (!error) return rows;
  if (!isMissingTable(error)) throw new Error(error.message);

  const all = await loadAllFromStorage(supabase);
  await saveAllToStorage(supabase, [...all, ...rows]);
  return rows;
}

export async function patchContatto(
  collaboratoreId: string,
  id: string,
  patch: Partial<ContattoInput>,
  supabase: SupabaseClient = portaleDb()
): Promise<ContattoCollaboratore> {
  const next = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("contatti_collaboratore")
    .update(next)
    .eq("id", id)
    .eq("collaboratore_id", collaboratoreId)
    .select(
      "id, collaboratore_id, nome_azienda, referente, telefono, email, note, stato, data_richiamo, data_call, created_at, updated_at"
    )
    .maybeSingle();

  if (!error && data) return mapRow(data as Record<string, unknown>);
  if (error && !isMissingTable(error)) throw new Error(error.message);

  const all = await loadAllFromStorage(supabase);
  const index = all.findIndex((item) => item.id === id && item.collaboratore_id === collaboratoreId);
  if (index < 0) throw new Error("Contatto non trovato.");
  all[index] = { ...all[index], ...patch, updated_at: next.updated_at };
  await saveAllToStorage(supabase, all);
  return all[index];
}

export async function removeContatto(
  collaboratoreId: string,
  id: string,
  supabase: SupabaseClient = portaleDb()
) {
  const { data, error } = await supabase
    .from("contatti_collaboratore")
    .delete()
    .eq("id", id)
    .eq("collaboratore_id", collaboratoreId)
    .select("id");
  if (!error && data && data.length > 0) return;
  if (error && !isMissingTable(error)) throw new Error(error.message);

  const all = await loadAllFromStorage(supabase);
  await saveAllToStorage(
    supabase,
    all.filter((item) => !(item.id === id && item.collaboratore_id === collaboratoreId))
  );
}

export function normalizzaChiaveDuplicato(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

export function isDuplicato(
  esistenti: ContattoCollaboratore[],
  input: Pick<ContattoInput, "telefono" | "email">
) {
  const tel = normalizzaChiaveDuplicato(input.telefono);
  const mail = normalizzaChiaveDuplicato(input.email);
  return esistenti.some((item) => {
    const itemTel = normalizzaChiaveDuplicato(item.telefono);
    const itemMail = normalizzaChiaveDuplicato(item.email);
    return (tel && itemTel && tel === itemTel) || (mail && itemMail && mail === itemMail);
  });
}
