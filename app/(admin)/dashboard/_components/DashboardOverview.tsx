"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Inbox, Sparkles, Hourglass, Send, CheckCircle2, Search, X } from "lucide-react";
import { STATO_OPTIONS, type StatoRichiesta } from "@/lib/richieste/stato";
import { RichiesteTable, type RichiestaListItem } from "./RichiesteTable";

type DashboardOverviewProps = {
  richieste: RichiestaListItem[];
};

const STAT_CARDS: {
  value: StatoRichiesta | "";
  label: string;
  icon: typeof Inbox;
  activeClasses: string;
  iconClasses: string;
}[] = [
  {
    value: "",
    label: "Totale richieste",
    icon: Inbox,
    activeClasses: "ring-brand-accent/50 shadow-brand-glow",
    iconClasses: "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/25",
  },
  {
    value: "nuovo",
    label: "Nuove",
    icon: Sparkles,
    activeClasses: "ring-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_20px_45px_-12px_rgba(59,130,246,0.35)]",
    iconClasses: "bg-blue-500/15 text-blue-300 ring-blue-500/25",
  },
  {
    value: "in_valutazione",
    label: "In valutazione",
    icon: Hourglass,
    activeClasses: "ring-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_20px_45px_-12px_rgba(245,158,11,0.35)]",
    iconClasses: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  },
  {
    value: "preventivo_inviato",
    label: "Preventivo inviato",
    icon: Send,
    activeClasses: "ring-orange-500/50 shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_20px_45px_-12px_rgba(249,115,22,0.35)]",
    iconClasses: "bg-orange-500/15 text-orange-300 ring-orange-500/25",
  },
  {
    value: "accettato",
    label: "Accettate",
    icon: CheckCircle2,
    activeClasses: "ring-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_20px_45px_-12px_rgba(16,185,129,0.35)]",
    iconClasses: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  },
];

export function DashboardOverview({ richieste }: DashboardOverviewProps) {
  const [search, setSearch] = useState("");
  const [statoFilter, setStatoFilter] = useState("");
  const [tipoProgettoFilter, setTipoProgettoFilter] = useState("");

  const tipiProgettoDisponibili = useMemo(() => {
    const trovati = new Set<string>();
    for (const richiesta of richieste) {
      if (richiesta.tipo_progetto) trovati.add(richiesta.tipo_progetto);
    }
    return Array.from(trovati).sort((a, b) => a.localeCompare(b, "it"));
  }, [richieste]);

  const conteggiPerStato = useMemo(() => {
    const counts: Partial<Record<StatoRichiesta, number>> = {};
    for (const richiesta of richieste) {
      const stato = richiesta.stato as StatoRichiesta;
      counts[stato] = (counts[stato] ?? 0) + 1;
    }
    return counts;
  }, [richieste]);

  const richiesteFiltrate = useMemo(() => {
    const term = search.trim().toLowerCase();
    return richieste.filter((richiesta) => {
      if (statoFilter && richiesta.stato !== statoFilter) return false;
      if (tipoProgettoFilter && richiesta.tipo_progetto !== tipoProgettoFilter) return false;
      if (!term) return true;
      const haystack = `${richiesta.nome} ${richiesta.cognome} ${richiesta.nome_azienda ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [richieste, search, statoFilter, tipoProgettoFilter]);

  function handleStatoSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatoFilter(event.target.value);
  }

  function handleTipoProgettoSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    setTipoProgettoFilter(event.target.value);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((card) => {
          const count = card.value === "" ? richieste.length : conteggiPerStato[card.value] ?? 0;
          const isActive = statoFilter === card.value;
          const Icon = card.icon;

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatoFilter((current) => (current === card.value ? "" : card.value))}
              className={`group relative overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated p-4 text-left shadow-brand-md ring-1 ring-inset ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-brand-glow sm:p-5 ${
                isActive ? `ring-2 ${card.activeClasses}` : ""
              }`}
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${card.iconClasses}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <p className="mt-3.5 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
                {count}
              </p>
              <p className="mt-1 text-xs font-medium text-brand-muted">{card.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Cerca per nome, cognome o azienda..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface py-2.5 pl-9 pr-9 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Cancella ricerca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-brand-muted transition hover:text-brand-accent-light"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={tipoProgettoFilter}
            onChange={handleTipoProgettoSelectChange}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:w-56"
          >
            <option value="">Tutti i tipi di progetto</option>
            {tipiProgettoDisponibili.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>

          <select
            value={statoFilter}
            onChange={handleStatoSelectChange}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:w-56"
          >
            <option value="">Tutti gli stati</option>
            {STATO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <RichiesteTable richieste={richiesteFiltrate} totale={richieste.length} />
    </div>
  );
}
