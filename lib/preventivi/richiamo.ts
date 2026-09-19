import { addGiorni, oggiIsoRoma } from "@/lib/calendario/date";
import { isPreventivoAttivo } from "./stato";

export const GIORNI_RICHIAMO_PREVENTIVO = 7;

function utcMidnight(iso: string) {
  const [anno, mese, giorno] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(anno, (mese ?? 1) - 1, giorno ?? 1);
}

export function giorniDaInvio(dataInvio: string, oggi = oggiIsoRoma()) {
  return Math.round((utcMidnight(oggi) - utcMidnight(dataInvio)) / 86_400_000);
}

export function dataRichiamoIso(dataInvio: string) {
  return addGiorni(dataInvio.slice(0, 10), GIORNI_RICHIAMO_PREVENTIVO);
}

export function isDaRicontattare(dataInvio: string, stato: string, oggi = oggiIsoRoma()) {
  return isPreventivoAttivo(stato) && giorniDaInvio(dataInvio, oggi) >= GIORNI_RICHIAMO_PREVENTIVO;
}

export function labelRichiamoPreventivo(dataInvio: string, stato: string, oggi = oggiIsoRoma()) {
  if (!isPreventivoAttivo(stato) || !dataInvio) return null;
  const giorni = giorniDaInvio(dataInvio, oggi);
  if (giorni >= GIORNI_RICHIAMO_PREVENTIVO) {
    return {
      urgente: true as const,
      testo:
        giorni === GIORNI_RICHIAMO_PREVENTIVO
          ? "Da ricontattare · 1 settimana"
          : `Da ricontattare · ${giorni} giorni`,
    };
  }
  const manca = GIORNI_RICHIAMO_PREVENTIVO - giorni;
  return {
    urgente: false as const,
    testo: manca === 1 ? "Richiamo domani" : `Richiamo tra ${manca} giorni`,
  };
}

export function etichettaClientePreventivo(row: {
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  numero_preventivo?: string | null;
}) {
  const persona = `${row.nome ?? ""} ${row.cognome ?? ""}`.trim();
  if (persona && row.azienda) return `${persona} · ${row.azienda}`;
  if (persona) return persona;
  if (row.azienda) return row.azienda;
  return row.numero_preventivo || "Preventivo";
}
