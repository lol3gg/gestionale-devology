import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDigestMattina } from "./digest";
import { buildPayloadRichiamoPreventivi, listPreventiviDaRicontattare } from "./preventiviRichiamo";
import { sendPushToAll } from "./send";

export async function inviaNotificheMattina(supabase: SupabaseClient) {
  const callPayload = await buildDigestMattina(supabase);
  const callResult = await sendPushToAll(supabase, callPayload);

  let richiamo: {
    title: string;
    body: string;
    sent: number;
    total: number;
    count: number;
  } | null = null;

  try {
    const daRicontattare = await listPreventiviDaRicontattare(supabase);
    const payload = buildPayloadRichiamoPreventivi(daRicontattare);
    if (payload) {
      const result = await sendPushToAll(supabase, payload);
      richiamo = {
        title: payload.title,
        body: payload.body,
        sent: result.sent,
        total: result.total,
        count: daRicontattare.length,
      };
    }
  } catch {
    richiamo = null;
  }

  return {
    sent: callResult.sent,
    total: callResult.total,
    failures: callResult.failures,
    title: callPayload.title,
    body: callPayload.body,
    richiamo,
  };
}
