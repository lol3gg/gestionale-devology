/** Formatta una data come "16 lug 2026". */
export function formatDataBreve(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

/** Converte una data ISO ("2026-08-20", da input type="date") in formato leggibile "20/08/2026". */
export function formatDataItaliana(isoDate: string): string {
  const [anno, mese, giorno] = isoDate.split("-");
  return `${giorno}/${mese}/${anno}`;
}

/**
 * Converte una data leggibile "20/08/2026" (salvata in "tempistiche") nel
 * formato ISO "2026-08-20" richiesto da un input type="date". Ritorna "" se
 * il valore non è una data valida (es. "Flessibile" o vuoto).
 */
export function tempisticheToIsoDate(tempistiche: string | null): string {
  if (!tempistiche) return "";
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(tempistiche.trim());
  if (!match) return "";
  const [, giorno, mese, anno] = match;
  return `${anno}-${mese}-${giorno}`;
}

/**
 * La colonna "tempistiche" salva una data leggibile in formato "gg/mm/aaaa"
 * (es. "20/08/2026") oppure la stringa "Flessibile". Questo helper prova a
 * interpretarla come data per calcolare quanto tempo manca alla scadenza.
 */
function parseTempisticheDate(tempistiche: string | null): Date | null {
  if (!tempistiche) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(tempistiche.trim());
  if (!match) return null;

  const [, giorno, mese, anno] = match;
  const data = new Date(Number(anno), Number(mese) - 1, Number(giorno));
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Giorni rimanenti (interi, con segno) tra oggi e la data richiesta come
 * scadenza. Ritorna null se "tempistiche" è "Flessibile" o non è una data valida.
 */
export function getGiorniAllaScadenza(tempistiche: string | null): number | null {
  const scadenza = parseTempisticheDate(tempistiche);
  if (!scadenza) return null;

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  scadenza.setHours(0, 0, 0, 0);

  return Math.round((scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
}
