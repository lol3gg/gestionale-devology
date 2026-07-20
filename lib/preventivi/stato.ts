export type StatoPreventivo =
  | "inviato"
  | "in_attesa"
  | "accettato"
  | "rifiutato"
  | "scaduto";

export const STATO_PREVENTIVO_OPTIONS: { value: StatoPreventivo; label: string }[] = [
  { value: "inviato", label: "Inviato" },
  { value: "in_attesa", label: "In attesa" },
  { value: "accettato", label: "Accettato" },
  { value: "rifiutato", label: "Rifiutato" },
  { value: "scaduto", label: "Scaduto" },
];

export const STATO_PREVENTIVO_DEFAULT: StatoPreventivo = "inviato";

/** Stati ancora in corso (non chiusi). */
export const STATI_PREVENTIVO_ATTIVI: StatoPreventivo[] = ["inviato", "in_attesa"];

/** Stati conclusi (accettato / rifiutato / scaduto). */
export const STATI_PREVENTIVO_NON_ATTIVI: StatoPreventivo[] = [
  "accettato",
  "rifiutato",
  "scaduto",
];

export const STATO_PREVENTIVO_BADGE: Record<StatoPreventivo, string> = {
  inviato: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  in_attesa: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  accettato: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  rifiutato: "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/30",
  scaduto: "bg-white/10 text-brand-muted ring-white/15",
};

export function getStatoPreventivoLabel(stato: string) {
  return STATO_PREVENTIVO_OPTIONS.find((option) => option.value === stato)?.label ?? stato;
}

export function isStatoPreventivo(value: string): value is StatoPreventivo {
  return STATO_PREVENTIVO_OPTIONS.some((option) => option.value === value);
}

export function isPreventivoAttivo(stato: string) {
  const key = isStatoPreventivo(stato) ? stato : STATO_PREVENTIVO_DEFAULT;
  return STATI_PREVENTIVO_ATTIVI.includes(key);
}
