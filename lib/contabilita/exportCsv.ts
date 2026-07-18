import { getCategoriaLabel } from "@/lib/contabilita/categorie";
import type { PeriodoContabilita } from "@/lib/contabilita/format";

export type MovimentoCsvRow = {
  tipo: "entrata" | "uscita";
  categoria: string;
  descrizione: string;
  importo: number;
  data: string;
  note: string | null;
  richiesta: { nome: string; cognome: string } | null;
};

/** Slug periodo per il nome file, es. "2026-07", "ultimo-anno", "2026-01-01_2026-07-18". */
export function getPeriodoSlug(periodo: PeriodoContabilita): string {
  if (periodo.tipo === "mese") return periodo.mese;
  if (periodo.tipo === "anno_corrente") return `anno-${new Date().getFullYear()}`;
  if (periodo.tipo === "ultimo_anno") return "ultimo-anno";
  return `${periodo.da}_${periodo.a}`;
}

/** Data odierna come "gg-mm-aaaa" per il nome file. */
export function getDataOdiernaFile(): string {
  const now = new Date();
  const giorno = String(now.getDate()).padStart(2, "0");
  const mese = String(now.getMonth() + 1).padStart(2, "0");
  const anno = now.getFullYear();
  return `${giorno}-${mese}-${anno}`;
}

export function buildContabilitaCsvFilename(periodo: PeriodoContabilita): string {
  return `contabilita_${getPeriodoSlug(periodo)}_${getDataOdiernaFile()}.csv`;
}

/** Converte "YYYY-MM-DD" in "gg/mm/aaaa" (formato Excel italiano). */
function formatDataCsv(isoDate: string): string {
  const [anno, mese, giorno] = isoDate.split("-");
  if (!anno || !mese || !giorno) return isoDate;
  return `${giorno}/${mese}/${anno}`;
}

/** Importo in formato italiano senza simbolo € (es. "1.250,50"). */
function formatImportoCsv(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: "always",
  }).format(value);
}

function escapeCsvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: string[]): string {
  return cells.map(escapeCsvCell).join(";");
}

export type ContabilitaCsvTotals = {
  entrateTotali: number;
  usciteTotali: number;
  saldoNetto: number;
  abbonamentiTotaleMensile: number;
};

/**
 * Genera il contenuto CSV (UTF-8 con BOM, separatore `;`) dei movimenti del periodo
 * più le righe di riepilogo finali.
 */
export function buildContabilitaCsv(
  movimenti: MovimentoCsvRow[],
  totals: ContabilitaCsvTotals
): string {
  const lines: string[] = [];

  lines.push(
    row(["Data", "Tipo", "Categoria", "Descrizione", "Importo", "Cliente collegato", "Note"])
  );

  // Ordine cronologico crescente nel file (più naturale in Excel), indipendente dalla UI.
  const ordinati = [...movimenti].sort((a, b) => a.data.localeCompare(b.data));

  for (const movimento of ordinati) {
    const cliente = movimento.richiesta
      ? `${movimento.richiesta.nome} ${movimento.richiesta.cognome}`.trim()
      : "";
    lines.push(
      row([
        formatDataCsv(movimento.data),
        movimento.tipo === "entrata" ? "Entrata" : "Uscita",
        getCategoriaLabel(movimento.categoria),
        movimento.descrizione,
        formatImportoCsv(Number(movimento.importo)),
        cliente,
        movimento.note ?? "",
      ])
    );
  }

  lines.push("");
  lines.push(row(["", "", "", "Entrate totali", formatImportoCsv(totals.entrateTotali), "", ""]));
  lines.push(row(["", "", "", "Uscite totali", formatImportoCsv(totals.usciteTotali), "", ""]));
  lines.push(row(["", "", "", "Saldo netto", formatImportoCsv(totals.saldoNetto), "", ""]));
  lines.push(
    row([
      "",
      "",
      "",
      "Totale abbonamenti mensili attivi",
      formatImportoCsv(totals.abbonamentiTotaleMensile),
      "",
      "",
    ])
  );

  // BOM UTF-8: Excel (Windows) riconosce correttamente accenti e simboli.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
