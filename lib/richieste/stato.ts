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
  nuovo: "bg-blue-100 text-blue-700 ring-blue-200",
  in_valutazione: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  preventivo_inviato: "bg-orange-100 text-orange-700 ring-orange-200",
  accettato: "bg-green-100 text-green-700 ring-green-200",
  rifiutato: "bg-red-100 text-red-700 ring-red-200",
  archiviato: "bg-gray-100 text-gray-700 ring-gray-200",
};

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
