export const TIMEZONE_ROMA = "Europe/Rome";

/** Prima fascia prenotabile (08:00). */
export const SLOT_INIZIO_MINUTI = 8 * 60;
/** Ultimo inizio fascia (20:30 → call 20:30–21:00). */
export const SLOT_FINE_MINUTI = 20 * 60 + 30;
export const SLOT_DURATA_MINUTI = 30;
export const SLOT_ALTEZZA_PX = 44;

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
  for (let minuti = SLOT_INIZIO_MINUTI; minuti <= SLOT_FINE_MINUTI; minuti += SLOT_DURATA_MINUTI) {
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
  const resto = clamped % SLOT_DURATA_MINUTI;
  const next = resto === 0 ? clamped : clamped + (SLOT_DURATA_MINUTI - resto);
  const limited = Math.min(SLOT_FINE_MINUTI, next);
  return minutiToOra(limited);
}

export function isSlotPassato(giorno: string, ora: string, oggi: string, minutiOra: number): boolean {
  if (giorno < oggi) return true;
  if (giorno > oggi) return false;
  return oraToMinuti(ora) + SLOT_DURATA_MINUTI <= minutiOra;
}
