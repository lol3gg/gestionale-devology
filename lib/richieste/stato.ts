export type StatoRichiesta =
  | "nuovo"
  | "in_valutazione"
  | "preventivo_inviato"
  | "accettato"
  | "rifiutato"
  | "archiviato";

export const STATO_OPTIONS: { value: StatoRichiesta; label: string }[] = [
  { value: "nuovo", label: "Nuovo" },
  { value: "in_valutazione", label: "In valutazione" },
  { value: "preventivo_inviato", label: "Preventivo inviato" },
  { value: "accettato", label: "Accettato" },
  { value: "rifiutato", label: "Rifiutato" },
  { value: "archiviato", label: "Archiviato" },
];

export const STATO_BADGE_CLASSES: Record<StatoRichiesta, string> = {
  nuovo: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  in_valutazione: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  preventivo_inviato: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  accettato: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  rifiutato: "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/30",
  archiviato: "bg-white/10 text-brand-soft ring-white/15",
};

/** Colore del pallino indicatore, usato nei badge e nella progress bar di stato. */
export const STATO_DOT_CLASSES: Record<StatoRichiesta, string> = {
  nuovo: "bg-blue-400",
  in_valutazione: "bg-amber-400",
  preventivo_inviato: "bg-orange-400",
  accettato: "bg-emerald-400",
  rifiutato: "bg-brand-accent-light",
  archiviato: "bg-brand-soft",
};

/** Ordine "di avanzamento" usato per la progress bar nella pagina di dettaglio. */
export const STATO_PROGRESS_ORDER: StatoRichiesta[] = [
  "nuovo",
  "in_valutazione",
  "preventivo_inviato",
  "accettato",
];

export function getStatoLabel(stato: string) {
  return STATO_OPTIONS.find((option) => option.value === stato)?.label ?? stato;
}

/** Forme usate nel riepilogo conteggi in dashboard (es. "3 nuove, 2 in valutazione"). */
export const STATO_SUMMARY_LABELS: Record<StatoRichiesta, string> = {
  nuovo: "nuove",
  in_valutazione: "in valutazione",
  preventivo_inviato: "con preventivo inviato",
  accettato: "accettate",
  rifiutato: "rifiutate",
  archiviato: "archiviate",
};
