import type { Collaboratore, CollaboratoreLavoro } from "./types";

/** Compenso dovuto = prezzo del preventivo × percentuale. */
export function importoDovuto(prezzo: number, percentuale: number) {
  return Math.round(((prezzo || 0) * (percentuale || 0)) / 100 * 100) / 100;
}

export function residuoLavoro(lavoro: CollaboratoreLavoro) {
  return Math.max(0, Math.round((importoDovuto(lavoro.prezzo, lavoro.percentuale) - lavoro.importo_pagato) * 100) / 100);
}

export function isPreventivoChiuso(stato: string | null | undefined) {
  return stato === "accettato";
}

export function riepilogoCollaboratore(collaboratore: Collaboratore) {
  const chiusi = collaboratore.lavori.filter(
    (lavoro) => !lavoro.preventivo || isPreventivoChiuso(lavoro.preventivo.stato)
  );
  const totalePreventivato = chiusi.reduce((sum, lavoro) => sum + (lavoro.prezzo || 0), 0);
  const dovuto = chiusi.reduce(
    (sum, lavoro) => sum + importoDovuto(lavoro.prezzo, lavoro.percentuale),
    0
  );
  const pagato = chiusi.reduce((sum, lavoro) => sum + (lavoro.importo_pagato || 0), 0);
  const daMandare = Math.max(0, Math.round((dovuto - pagato) * 100) / 100);

  return {
    chiusiCount: chiusi.length,
    lavoriCount: collaboratore.lavori.length,
    totalePreventivato,
    dovuto,
    pagato,
    daMandare,
  };
}

export function riepilogoGlobale(collaboratori: Collaboratore[]) {
  return collaboratori.reduce(
    (acc, collaboratore) => {
      const stats = riepilogoCollaboratore(collaboratore);
      acc.chiusiCount += stats.chiusiCount;
      acc.totalePreventivato += stats.totalePreventivato;
      acc.dovuto += stats.dovuto;
      acc.pagato += stats.pagato;
      acc.daMandare += stats.daMandare;
      if (collaboratore.attivo) acc.attiviCount += 1;
      return acc;
    },
    {
      attiviCount: 0,
      chiusiCount: 0,
      totalePreventivato: 0,
      dovuto: 0,
      pagato: 0,
      daMandare: 0,
    }
  );
}

export function labelPreventivo(preventivo: {
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  numero_preventivo: string | null;
  prezzo: number | null;
}) {
  const nome = `${preventivo.nome ?? ""} ${preventivo.cognome ?? ""}`.trim();
  const parti = [nome || null, preventivo.azienda || null, preventivo.numero_preventivo || null].filter(
    Boolean
  );
  return parti.join(" · ") || "Preventivo";
}
