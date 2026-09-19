import type { SupabaseClient } from "@supabase/supabase-js";
import { addGiorni, oggiIsoRoma } from "@/lib/calendario/date";
import { GIORNI_RICHIAMO_PREVENTIVO } from "@/lib/preventivi/richiamo";
import { STATI_PREVENTIVO_ATTIVI } from "@/lib/preventivi/stato";

export type NavCounts = {
  nuoveCount: number;
  archivioCount: number;
  richiamiCount: number;
};

let cache: { at: number; value: NavCounts } | null = null;
const TTL_MS = 20_000;

export function invalidaNavCounts() {
  cache = null;
}

export async function getNavCounts(supabase: SupabaseClient): Promise<NavCounts> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const limiteRichiamo = addGiorni(oggiIsoRoma(), -GIORNI_RICHIAMO_PREVENTIVO);
  const [{ count: nuoveCount }, { count: archivioCount }, richiamiResult] = await Promise.all([
    supabase.from("richieste").select("id", { count: "exact", head: true }).eq("stato", "nuovo"),
    supabase.from("richieste").select("id", { count: "exact", head: true }).eq("stato", "archiviato"),
    supabase
      .from("preventivi")
      .select("id", { count: "exact", head: true })
      .in("stato", STATI_PREVENTIVO_ATTIVI)
      .lte("data_invio", limiteRichiamo),
  ]);

  const value: NavCounts = {
    nuoveCount: nuoveCount ?? 0,
    archivioCount: archivioCount ?? 0,
    richiamiCount: richiamiResult.error ? 0 : richiamiResult.count ?? 0,
  };
  cache = { at: Date.now(), value };
  return value;
}
