export const TIMEZONE_ROMA = "Europe/Rome";

/** Prima fascia prenotabile (04:00). */
export const SLOT_INIZIO_MINUTI = 4 * 60;
/** Ultimo inizio fascia (19:30). */
export const SLOT_FINE_MINUTI = 19 * 60 + 30;
/** Passo della griglia. */
export const SLOT_PASSO_MINUTI = 10;
/** Durata call di default: occupa 3 slot da 10 minuti. */
export const CALL_DURATA_DEFAULT = 30;
export const CALL_DURATE = [10, 20, 30, 40, 50, 60, 90, 120] as const;
export const SLOT_ALTEZZA_PX = 22;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const GIORNI_SETT_BREVI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const GIORNI_SETT_LUNGHI = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export function isIsoDate(value: string | undefined): value is string {
  return !!value && ISO_DATE.test(value);
}

/** Data civile di oggi in Italia, formato YYYY-MM-DD. */
export function oggiIsoRoma(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_ROMA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addGiorni(iso: string, giorni: number): string {
  const [anno, mese, giorno] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(anno, mese - 1, giorno + giorni));
  return utc.toISOString().slice(0, 10);
}

/** 0 = lunedì … 6 = domenica. */
export function weekdayLunedi0(iso: string): number {
  const [anno, mese, giorno] = iso.split("-").map(Number);
  const jsDay = new Date(Date.UTC(anno, mese - 1, giorno)).getUTCDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function lunediDellaSettimana(iso: string): string {
  return addGiorni(iso, -weekdayLunedi0(iso));
}

export function giorniSettimana(lunedi: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addGiorni(lunedi, index));
}

export function minutiToOra(minuti: number): string {
  const ore = Math.floor(minuti / 60);
  const rest = minuti % 60;
  return `${String(ore).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function oraToMinuti(ora: string): number {
  const [ore, minuti] = normalizzaOra(ora).split(":").map(Number);
  return ore * 60 + minuti;
}

export function normalizzaOra(value: string | null | undefined): string {
  if (!value) return "00:00";
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return "00:00";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function generaSlot(): string[] {
  const slots: string[] = [];
  for (let minuti = SLOT_INIZIO_MINUTI; minuti <= SLOT_FINE_MINUTI; minuti += SLOT_PASSO_MINUTI) {
    slots.push(minutiToOra(minuti));
  }
  return slots;
}

export const SLOT_ORE = generaSlot();

export function formatGiornoCompleto(iso: string): string {
  const [anno, mese, giorno] = iso.split("-").map(Number);
  return new Date(Date.UTC(anno, mese - 1, giorno)).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatGiornoCorto(iso: string): string {
  const [anno, mese, giorno] = iso.split("-").map(Number);
  return new Date(Date.UTC(anno, mese - 1, giorno)).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function minutiCorrentiRoma(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_ROMA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const ore = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minuti = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return ore * 60 + minuti;
}

export function arrotondaAlProssimoSlot(minuti: number): string {
  const clamped = Math.max(SLOT_INIZIO_MINUTI, Math.min(SLOT_FINE_MINUTI, minuti));
  const resto = clamped % SLOT_PASSO_MINUTI;
  const next = resto === 0 ? clamped : clamped + (SLOT_PASSO_MINUTI - resto);
  const limited = Math.min(SLOT_FINE_MINUTI, next);
  return minutiToOra(limited);
}

export function isSlotPassato(giorno: string, ora: string, oggi: string, minutiOra: number): boolean {
  if (giorno < oggi) return true;
  if (giorno > oggi) return false;
  return oraToMinuti(ora) + SLOT_PASSO_MINUTI <= minutiOra;
}

export function durataCall(durataMinuti: number | null | undefined): number {
  const n = Number(durataMinuti);
  if (!Number.isFinite(n) || n < SLOT_PASSO_MINUTI) return CALL_DURATA_DEFAULT;
  return Math.round(n / SLOT_PASSO_MINUTI) * SLOT_PASSO_MINUTI;
}

export function oraFineCall(ora: string, durataMinuti: number): string {
  return minutiToOra(oraToMinuti(ora) + durataCall(durataMinuti));
}

export function slotSpan(durataMinuti: number): number {
  return Math.max(1, Math.ceil(durataCall(durataMinuti) / SLOT_PASSO_MINUTI));
}

/** Quanti slot da 10 minuti restano visibili in giornata (non oltre le 19:30). */
export function slotSpanVisibile(ora: string, durataMinuti: number): number {
  const startIdx = SLOT_ORE.indexOf(normalizzaOra(ora));
  if (startIdx < 0) return 1;
  return Math.min(slotSpan(durataMinuti), SLOT_ORE.length - startIdx);
}

/** True se lo slot da 10 minuti cade dentro la call (inizio incluso, fine esclusa). */
export function callCopreSlot(giornoCall: string, oraCall: string, durataMinuti: number, giorno: string, ora: string) {
  if (giornoCall !== giorno) return false;
  const start = oraToMinuti(oraCall);
  const end = start + durataCall(durataMinuti);
  const slot = oraToMinuti(ora);
  return slot >= start && slot < end;
}

export function intervalliSiSovrappongono(
  startA: number,
  durataA: number,
  startB: number,
  durataB: number
) {
  return startA < startB + durataB && startB < startA + durataA;
}
