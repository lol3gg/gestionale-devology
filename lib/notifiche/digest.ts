import type { SupabaseClient } from "@supabase/supabase-js";
import { oggiIsoRoma } from "@/lib/calendario/date";
import { listCalls } from "@/lib/calendario/store";
import type { NotificaMattinaPayload } from "./types";

function formatElenco(calls: { ora: string; azienda: string }[]) {
  return calls.map((call) => `${call.ora} ${call.azienda}`).join(" · ");
}

export async function buildDigestMattina(supabase: SupabaseClient): Promise<NotificaMattinaPayload> {
  const oggi = oggiIsoRoma();
  const { calls, error } = await listCalls(supabase, oggi, oggi);
  if (error) {
    throw new Error(error);
  }

  const ordinate = [...calls].sort((a, b) => a.ora.localeCompare(b.ora));
  if (ordinate.length === 0) {
    return {
      title: "Nessuna call oggi",
      body: "In calendario non ci sono appuntamenti per oggi.",
      url: "/dashboard/calendario",
      tag: `call-mattina-${oggi}`,
    };
  }

  const elenco = formatElenco(ordinate);
  return {
    title: ordinate.length === 1 ? "1 call oggi" : `${ordinate.length} call oggi`,
    body: elenco.length > 180 ? `${elenco.slice(0, 177)}…` : elenco,
    url: "/dashboard/calendario",
    tag: `call-mattina-${oggi}`,
  };
}
