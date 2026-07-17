"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  buildQueryPeriodo,
  getPeriodoCorrente,
  shiftPeriodo,
  type PeriodoContabilita,
  type TipoPeriodoContabilita,
} from "@/lib/contabilita/format";

type SelettorePeriodoProps = {
  periodo: PeriodoContabilita;
};

const TABS: { tipo: TipoPeriodoContabilita; label: string }[] = [
  { tipo: "mese", label: "Mensile" },
  { tipo: "ultimo_anno", label: "Ultimo anno" },
  { tipo: "anno_corrente", label: "Da inizio anno" },
  { tipo: "personalizzato", label: "Personalizzato" },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function SelettorePeriodo({ periodo }: SelettorePeriodoProps) {
  const router = useRouter();

  const [daPersonalizzato, setDaPersonalizzato] = useState(
    periodo.tipo === "personalizzato" ? periodo.da : `${new Date().getFullYear()}-01-01`
  );
  const [aPersonalizzato, setAPersonalizzato] = useState(
    periodo.tipo === "personalizzato" ? periodo.a : todayIsoDate()
  );

  function vaiA(query: string) {
    router.push(`/dashboard/contabilita?${query}`);
  }

  function selezionaTab(tipo: TipoPeriodoContabilita) {
    if (tipo === "mese") {
      vaiA(buildQueryPeriodo({ tipo: "mese", mese: periodo.tipo === "mese" ? periodo.mese : getPeriodoCorrente() }));
      return;
    }
    if (tipo === "personalizzato") {
      vaiA(buildQueryPeriodo({ tipo: "personalizzato", da: daPersonalizzato, a: aPersonalizzato }));
      return;
    }
    vaiA(buildQueryPeriodo({ tipo }));
  }

  const isMeseCorrente = periodo.tipo === "mese" && periodo.mese === getPeriodoCorrente();

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-brand-border-strong bg-brand-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.tipo}
            type="button"
            onClick={() => selezionaTab(tab.tipo)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              periodo.tipo === tab.tipo
                ? "bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] text-white shadow-sm"
                : "text-brand-muted hover:bg-brand-border-strong hover:text-brand-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {periodo.tipo === "mese" && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-border-strong bg-brand-surface p-1.5">
          <button
            type="button"
            onClick={() => vaiA(buildQueryPeriodo({ tipo: "mese", mese: shiftPeriodo(periodo.mese, -1) }))}
            aria-label="Mese precedente"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-border-strong hover:text-brand-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <label className="relative flex-1">
            <span className="sr-only">Seleziona mese</span>
            <input
              type="month"
              value={periodo.mese}
              onChange={(event) => event.target.value && vaiA(buildQueryPeriodo({ tipo: "mese", mese: event.target.value }))}
              className="w-full cursor-pointer rounded-lg bg-transparent px-2 py-1 text-center text-sm font-semibold text-brand-text [color-scheme:dark] focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => vaiA(buildQueryPeriodo({ tipo: "mese", mese: shiftPeriodo(periodo.mese, 1) }))}
            aria-label="Mese successivo"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-border-strong hover:text-brand-text"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {!isMeseCorrente && (
            <button
              type="button"
              onClick={() => vaiA(buildQueryPeriodo({ tipo: "mese", mese: getPeriodoCorrente() }))}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-brand-accent-light transition hover:bg-brand-accent/10"
            >
              Oggi
            </button>
          )}
        </div>
      )}

      {periodo.tipo === "personalizzato" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            vaiA(buildQueryPeriodo({ tipo: "personalizzato", da: daPersonalizzato, a: aPersonalizzato }));
          }}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-border-strong bg-brand-surface p-2"
        >
          <input
            type="date"
            value={daPersonalizzato}
            onChange={(event) => setDaPersonalizzato(event.target.value)}
            className="rounded-lg border border-brand-border bg-brand-elevated px-2 py-1.5 text-xs font-medium text-brand-text [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
          />
          <span className="text-xs text-brand-muted">→</span>
          <input
            type="date"
            value={aPersonalizzato}
            onChange={(event) => setAPersonalizzato(event.target.value)}
            className="rounded-lg border border-brand-border bg-brand-elevated px-2 py-1.5 text-xs font-medium text-brand-text [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            Applica
          </button>
        </form>
      )}
    </div>
  );
}
