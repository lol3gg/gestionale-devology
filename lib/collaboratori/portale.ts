import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";
import {
  generaTokenCollaboratore,
  isTokenCollaboratore,
  leggiTokenCollaboratore,
} from "@/lib/collaboratori/token";
import type { CollaboratorePortale } from "@/lib/collaboratori/types";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "collaboratori/portale-token.json";

export type TokenRecord = {
  id: string;
  token: string;
  link_attivo: boolean;
};

function isMissingColumn(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /token|link_attivo|schema cache|column/i.test(error.message ?? "")
  );
}

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

async function loadTokenFile(supabase: SupabaseClient): Promise<TokenRecord[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return [];
    throw new Error(`Impossibile leggere i token portale: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { tokens?: TokenRecord[] };
    return Array.isArray(parsed.tokens) ? parsed.tokens : [];
  } catch {
    return [];
  }
}

async function saveTokenFile(supabase: SupabaseClient, tokens: TokenRecord[]) {
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(JSON.stringify({ tokens }), "utf-8"),
    { contentType: "application/json", upsert: true }
  );
  if (error) {
    throw new Error(`Impossibile salvare i token portale: ${error.message}`);
  }
}

export async function saveCollaboratoreToken(id: string, token: string, linkAttivo = true) {
  const supabase = createClient();
  const { error } = await supabase
    .from("collaboratori")
    .update({ token, link_attivo: linkAttivo })
    .eq("id", id);
  if (!error) return { token, link_attivo: linkAttivo };

  if (!isMissingColumn(error)) {
    throw new Error(`Impossibile salvare il token: ${error.message}`);
  }

  const tokens = await loadTokenFile(supabase);
  const next = tokens.filter((item) => item.id !== id);
  next.push({ id, token, link_attivo: linkAttivo });
  await saveTokenFile(supabase, next);
  return { token, link_attivo: linkAttivo };
}

export async function removeCollaboratoreToken(id: string) {
  const supabase = createClient();
  try {
    const tokens = await loadTokenFile(supabase);
    await saveTokenFile(
      supabase,
      tokens.filter((item) => item.id !== id)
    );
  } catch {
    // File assente: niente da pulire.
  }
}

function recordsToMap(records: TokenRecord[]) {
  return new Map(records.map((item) => [item.id, item]));
}

function tokenValidoPer(id: string, token: string | null | undefined) {
  if (!token || token.includes(".")) return false;
  return leggiTokenCollaboratore(token)?.id === id;
}

/** Genera e persiste i token mancanti (colonna DB se c'è, altrimenti Storage). */
export async function ensureCollaboratoriTokens(): Promise<Map<string, TokenRecord>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("collaboratori").select("id, nome, token, link_attivo");

    if (!error) {
      for (const row of data ?? []) {
        if (tokenValidoPer(row.id, row.token)) continue;
        await supabase
          .from("collaboratori")
          .update({
            token: generaTokenCollaboratore({ id: row.id, nome: row.nome }),
            link_attivo: row.link_attivo !== false,
          })
          .eq("id", row.id);
      }
      const { data: fresh } = await supabase.from("collaboratori").select("id, token, link_attivo");
      return recordsToMap(
        (fresh ?? [])
          .filter((row) => Boolean(row.token))
          .map((row) => ({
            id: row.id,
            token: String(row.token),
            link_attivo: row.link_attivo !== false,
          }))
      );
    }

    const { data: rows, error: idsError } = await supabase.from("collaboratori").select("id, nome");
    if (idsError) return new Map();

    const stored = await loadTokenFile(supabase);
    const byId = recordsToMap(stored);
    let changed = false;
    const existing = new Set((rows ?? []).map((row) => row.id));

    for (const row of rows ?? []) {
      const current = byId.get(row.id);
      if (current && tokenValidoPer(row.id, current.token)) continue;
      byId.set(row.id, {
        id: row.id,
        token: generaTokenCollaboratore({ id: row.id, nome: row.nome }),
        link_attivo: current?.link_attivo !== false,
      });
      changed = true;
    }
    for (const id of Array.from(byId.keys())) {
      if (!existing.has(id)) {
        byId.delete(id);
        changed = true;
      }
    }
    if (changed) await saveTokenFile(supabase, Array.from(byId.values()));
    return byId;
  } catch {
    return new Map();
  }
}

async function findPortaleInStorage(supabase: SupabaseClient, token: string): Promise<CollaboratorePortale | null> {
  const tokens = await loadTokenFile(supabase);
  const record = tokens.find((item) => item.token === token && item.link_attivo);
  if (!record) return null;

  const { data } = await supabase.from("collaboratori").select("id, nome").eq("id", record.id).maybeSingle();
  if (!data) return null;
  return { id: data.id, nome: data.nome, token: record.token };
}

async function isLinkDisattivato(id: string, supabase: SupabaseClient) {
  const { data, error } = await supabase.from("collaboratori").select("link_attivo").eq("id", id).maybeSingle();
  if (!error && data && data.link_attivo === false) return true;
  try {
    const stored = await loadTokenFile(supabase);
    const record = stored.find((item) => item.id === id);
    return record?.link_attivo === false;
  } catch {
    return false;
  }
}

/**
 * Accesso al portale collaboratore: valida il token server-side.
 * I token firmati non richiedono query al DB (il collaboratore non ha login).
 */
export async function getCollaboratorePortale(token: string): Promise<CollaboratorePortale | null> {
  if (!isTokenCollaboratore(token)) return null;

  const signed = leggiTokenCollaboratore(token);
  if (signed) {
    try {
      const supabase = hasServiceRoleKey() ? createServiceClient() : createClient();
      if (await isLinkDisattivato(signed.id, supabase)) return null;
    } catch {
      // Senza sessione admin il link firmato resta valido.
    }
    return { id: signed.id, nome: signed.nome, token };
  }

  try {
    const supabase = hasServiceRoleKey() ? createServiceClient() : createClient();
    const { data, error } = await supabase
      .from("collaboratori")
      .select("id, nome, token, link_attivo")
      .eq("token", token)
      .maybeSingle();

    if (!error && data?.link_attivo) {
      return { id: data.id, nome: data.nome, token: data.token };
    }

    return await findPortaleInStorage(supabase, token);
  } catch {
    return null;
  }
}
