import type { CallAppuntamento } from "@/lib/calendario/types";
import { addGiorni, durataCall, oraToMinuti } from "@/lib/calendario/date";

/** Finestra del riepilogo in Richieste: oggi + 13 giorni. */
export const RIEPILOGO_GIORNI = 13;
/** Quante call mostrare nel riquadro. */
export const RIEPILOGO_MAX = 6;

export function isCallFuturaOInCorso(call: CallAppuntamento, oggi: string, minutiOra: number) {
  if (call.giorno > oggi) return true;
  if (call.giorno < oggi) return false;
  return oraToMinuti(call.ora) + durataCall(call.durataMinuti) > minutiOra;
}

export function isCallInCorso(call: CallAppuntamento, oggi: string, minutiOra: number) {
  if (call.giorno !== oggi) return false;
  const start = oraToMinuti(call.ora);
  const end = start + durataCall(call.durataMinuti);
  return minutiOra >= start && minutiOra < end;
}

function capitalizza(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).replace(".", "") : value;
}

export function partiGiornoRelativo(iso: string, oggi: string) {
  if (iso === oggi) return { titolo: "Oggi" };
  if (iso === addGiorni(oggi, 1)) return { titolo: "Domani" };
  const [anno, mese, giorno] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(anno, mese - 1, giorno));
  return {
    titolo: capitalizza(
      data.toLocaleDateString("it-IT", { weekday: "short", timeZone: "UTC" })
    ),
    sotto: data.toLocaleDateString("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }),
  };
}

export function filtraProssimeCall(calls: CallAppuntamento[], oggi: string, minutiOra: number) {
  return calls.filter((call) => isCallFuturaOInCorso(call, oggi, minutiOra));
}
