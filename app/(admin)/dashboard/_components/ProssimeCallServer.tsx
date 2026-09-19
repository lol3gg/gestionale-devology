import { addGiorni, minutiCorrentiRoma, oggiIsoRoma } from "@/lib/calendario/date";
import { filtraProssimeCall, RIEPILOGO_GIORNI } from "@/lib/calendario/prossime";
import { listCalls } from "@/lib/calendario/store";
import { createClient } from "@/lib/supabase/server";
import { ProssimeCallRiepilogo } from "./ProssimeCallRiepilogo";

export async function ProssimeCallServer() {
  const oggi = oggiIsoRoma();
  const minutiOra = minutiCorrentiRoma();
  const { calls } = await listCalls(createClient(), oggi, addGiorni(oggi, RIEPILOGO_GIORNI));
  return (
    <ProssimeCallRiepilogo
      calls={filtraProssimeCall(calls, oggi, minutiOra)}
      oggi={oggi}
      minutiOra={minutiOra}
    />
  );
}
