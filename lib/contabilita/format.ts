/** Formatta un numero come valuta in euro, es. 1250 -> "1.250,00 €". */
export function formatEuro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    // Senza questa opzione l'ICU di Node non raggruppa le migliaia sotto i
    // 10.000 per la locale it-IT (es. "1250,00 €" invece di "1.250,00 €").
    useGrouping: "always",
  }).format(value);
}

/** Formatta una data "YYYY-MM-DD" come "17 lug 2026" (parsing locale, non UTC). */
export function formatDataBreve(value: string) {
  const [anno, mese, giorno] = value.split("-").map(Number);
  const date = anno && mese && giorno ? new Date(anno, mese - 1, giorno) : new Date(value);
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

/** Etichetta leggibile di un periodo "YYYY-MM", es. "Luglio 2026". */
export function getMeseLabel(periodo: string) {
  const [anno, mese] = periodo.split("-").map(Number);
  if (!anno || !mese || mese < 1 || mese > 12) return periodo;
  return `${MESI[mese - 1]} ${anno}`;
}

/** Periodo mensile corrente nel formato "YYYY-MM", usato come default del selettore. */
export function getPeriodoCorrente() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Mese precedente/successivo rispetto a quello passato, sempre in formato "YYYY-MM". */
export function shiftPeriodo(periodo: string, delta: number) {
  const [anno, mese] = periodo.split("-").map(Number);
  const date = new Date(anno, mese - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Formatta una data come "YYYY-MM-DD" usando i componenti locali (anno/mese/giorno),
 * MAI tramite toISOString(): quest'ultima converte in UTC e su fusi orari avanti
 * rispetto a UTC (es. Europe/Rome) sposta la data al giorno precedente.
 */
function toIso(date: Date) {
  const anno = date.getFullYear();
  const mese = String(date.getMonth() + 1).padStart(2, "0");
  const giorno = String(date.getDate()).padStart(2, "0");
  return `${anno}-${mese}-${giorno}`;
}

function todayIso() {
  return toIso(new Date());
}

/**
 * Converte una stringa "YYYY-MM-DD" in un Date locale a mezzanotte, senza passare da
 * new Date(stringa) (che interpreta le date "solo giorno" come UTC e puo' spostarle
 * al giorno sbagliato una volta rilette in ora locale).
 */
function parseIso(iso: string): Date {
  const [anno, mese, giorno] = iso.split("-").map(Number);
  return new Date(anno, (mese ?? 1) - 1, giorno ?? 1);
}

const MESE_REGEX = /^\d{4}-\d{2}$/;
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type TipoPeriodoContabilita = "mese" | "ultimo_anno" | "anno_corrente" | "personalizzato";

export type PeriodoContabilita =
  | { tipo: "mese"; mese: string }
  | { tipo: "ultimo_anno" }
  | { tipo: "anno_corrente" }
  | { tipo: "personalizzato"; da: string; a: string };

/** Valida/normalizza i parametri della query string in un periodo contabilità valido. */
export function normalizzaPeriodoContabilita(searchParams: {
  tipo?: string;
  mese?: string;
  da?: string;
  a?: string;
}): PeriodoContabilita {
  if (searchParams.tipo === "ultimo_anno") return { tipo: "ultimo_anno" };
  if (searchParams.tipo === "anno_corrente") return { tipo: "anno_corrente" };

  if (searchParams.tipo === "personalizzato") {
    const oggi = todayIso();
    const da = searchParams.da && DATA_REGEX.test(searchParams.da) ? searchParams.da : `${new Date().getFullYear()}-01-01`;
    const aRaw = searchParams.a && DATA_REGEX.test(searchParams.a) ? searchParams.a : oggi;
    const a = aRaw < da ? da : aRaw;
    return { tipo: "personalizzato", da, a };
  }

  const mese = searchParams.mese && MESE_REGEX.test(searchParams.mese) ? searchParams.mese : getPeriodoCorrente();
  return { tipo: "mese", mese };
}

/** Range [inizio, fine) in formato "YYYY-MM-DD" da usare per filtrare la colonna "data". */
export function getRangePeriodoContabilita(periodo: PeriodoContabilita): { inizio: string; fine: string } {
  if (periodo.tipo === "mese") {
    const [anno, mese] = periodo.mese.split("-").map(Number);
    return { inizio: toIso(new Date(anno, mese - 1, 1)), fine: toIso(new Date(anno, mese, 1)) };
  }

  if (periodo.tipo === "anno_corrente") {
    const oggi = new Date();
    // Da gennaio fino al mese corrente incluso (mai oltre): evita di contare mesi
    // futuri non ancora trascorsi, che gonfierebbero artificialmente i costi degli
    // abbonamenti ripartiti sul periodo.
    const inizio = new Date(oggi.getFullYear(), 0, 1);
    const fine = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 1);
    return { inizio: toIso(inizio), fine: toIso(fine) };
  }

  if (periodo.tipo === "ultimo_anno") {
    const oggi = new Date();
    // Finestra di 12 mesi piena (allineata ai mesi) che termina con il mese corrente incluso.
    const fine = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 1);
    const inizio = new Date(oggi.getFullYear(), oggi.getMonth() - 11, 1);
    return { inizio: toIso(inizio), fine: toIso(fine) };
  }

  const fineEsclusiva = parseIso(periodo.a);
  fineEsclusiva.setDate(fineEsclusiva.getDate() + 1);
  return { inizio: periodo.da, fine: toIso(fineEsclusiva) };
}

/** Etichetta leggibile del periodo selezionato, per intestazioni e sottotitoli. */
export function getPeriodoLabel(periodo: PeriodoContabilita): string {
  if (periodo.tipo === "mese") return getMeseLabel(periodo.mese);
  if (periodo.tipo === "anno_corrente") return `Anno ${new Date().getFullYear()} (da inizio anno)`;

  if (periodo.tipo === "ultimo_anno") {
    const { inizio, fine } = getRangePeriodoContabilita(periodo);
    const fineDate = parseIso(fine);
    fineDate.setDate(fineDate.getDate() - 1);
    const inizioLabel = getMeseLabel(inizio.slice(0, 7));
    const fineLabel = getMeseLabel(`${fineDate.getFullYear()}-${String(fineDate.getMonth() + 1).padStart(2, "0")}`);
    return `Ultimi 12 mesi (${inizioLabel} – ${fineLabel})`;
  }

  return `Dal ${formatDataBreve(periodo.da)} al ${formatDataBreve(periodo.a)}`;
}

/**
 * Numero di mesi calendariali coperti da un abbonamento all'interno del range [rangeInizio, rangeFine).
 * Usato per ripartire il costo mensile ricorrente sull'intero periodo selezionato (non solo un mese).
 */
export function contaMesiNelPeriodo(dataInizioAbbonamento: string | null, rangeInizio: string, rangeFine: string): number {
  const rangeInizioDate = parseIso(rangeInizio);
  const rangeFineDate = parseIso(rangeFine); // esclusiva
  const inizioAbbonamento = dataInizioAbbonamento ? parseIso(dataInizioAbbonamento) : null;
  const effettivoInizio = inizioAbbonamento && inizioAbbonamento > rangeInizioDate ? inizioAbbonamento : rangeInizioDate;

  if (effettivoInizio >= rangeFineDate) return 0;

  const ultimoGiornoIncluso = parseIso(rangeFine);
  ultimoGiornoIncluso.setDate(ultimoGiornoIncluso.getDate() - 1);

  const mesi =
    (ultimoGiornoIncluso.getFullYear() - effettivoInizio.getFullYear()) * 12 +
    (ultimoGiornoIncluso.getMonth() - effettivoInizio.getMonth()) +
    1;

  return Math.max(mesi, 0);
}

/** Ricostruisce la query string per navigare verso un periodo contabilità. */
export function buildQueryPeriodo(periodo: PeriodoContabilita): string {
  if (periodo.tipo === "mese") return `tipo=mese&mese=${periodo.mese}`;
  if (periodo.tipo === "personalizzato") return `tipo=personalizzato&da=${periodo.da}&a=${periodo.a}`;
  return `tipo=${periodo.tipo}`;
}
