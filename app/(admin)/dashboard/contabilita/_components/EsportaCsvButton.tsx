"use client";

import { Download } from "lucide-react";
import {
  buildContabilitaCsv,
  buildContabilitaCsvFilename,
  type ContabilitaCsvTotals,
  type MovimentoCsvRow,
} from "@/lib/contabilita/exportCsv";
import type { PeriodoContabilita } from "@/lib/contabilita/format";

type EsportaCsvButtonProps = {
  periodo: PeriodoContabilita;
  movimenti: MovimentoCsvRow[];
  totals: ContabilitaCsvTotals;
};

export function EsportaCsvButton({ periodo, movimenti, totals }: EsportaCsvButtonProps) {
  function handleExport() {
    const csv = buildContabilitaCsv(movimenti, totals);
    const filename = buildContabilitaCsvFilename(periodo);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3.5 py-2 text-xs font-semibold text-brand-soft shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light"
    >
      <Download className="h-3.5 w-3.5" />
      Esporta CSV
    </button>
  );
}
