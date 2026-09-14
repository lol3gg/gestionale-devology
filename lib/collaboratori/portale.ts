import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generaTokenCollaboratore, isTokenCollaboratore } from "@/lib/collaboratori/token";
import type { CollaboratorePortale } from "@/lib/collaboratori/types";

export async function ensureCollaboratoriTokens() {
  const supabase = createClient();
  const { data, error } = await supabase.from("collaboratori").select("id, token");
  if (error) return;

  const missing = (data ?? []).filter((row) => !row.token);
  for (const row of missing) {
    await supabase
      .from("collaboratori")
      .update({ token: generaTokenCollaboratore(), link_attivo: true })
      .eq("id", row.id);
  }
}

/**
 * Accesso al portale collaboratore: valida il token server-side e usa la
 * service role key. Il token non va mai usato con la anon key dal browser.
 */
export async function getCollaboratorePortale(token: string): Promise<CollaboratorePortale | null> {
  if (!isTokenCollaboratore(token)) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collaboratori")
    .select("id, nome, token, link_attivo")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.link_attivo) return null;

  return {
    id: data.id,
    nome: data.nome,
    token: data.token,
  };
}
