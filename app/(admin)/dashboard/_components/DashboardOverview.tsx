"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Sparkles, Hourglass, Send, CheckCircle2, Search, X } from "lucide-react";
import { STATO_OPTIONS, type StatoRichiesta } from "@/lib/richieste/stato";
import { TIPO_PROGETTO_OPTIONS } from "@/lib/richieste/progetto";
import { buildDashboardHref } from "@/lib/richieste/dashboardQuery";
import { RichiesteTable, type RichiestaListItem } from "./RichiesteTable";
import { PaginazioneRichieste } from "./PaginazioneRichieste";

type DashboardOverviewProps = {
  richieste: RichiestaListItem[];
  /** Conteggio exact dei risultati che rispettano i filtri correnti (per la paginazione). */
  totaleFiltrato: number;
  pagina: number;
  totalePagine: number;
  q: string;
  stato: StatoRichiesta | "";
  tipo: string;
  /** Conteggi globali (senza filtri) per le card KPI. */
  conteggiPerStato: Partial<Record<StatoRichiesta, number>>;
  totaleGlobale: number;
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
    activeClasses:
      "ring-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_20px_45px_-12px_rgba(59,130,246,0.35)]",
    iconClasses: "bg-blue-500/15 text-blue-300 ring-blue-500/25",
  },
  {
    value: "in_valutazione",
    label: "In valutazione",
    icon: Hourglass,
    activeClasses:
      "ring-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_20px_45px_-12px_rgba(245,158,11,0.35)]",
    iconClasses: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  },
  {
    value: "preventivo_inviato",
    label: "Preventivo inviato",
    icon: Send,
    activeClasses:
      "ring-orange-500/50 shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_20px_45px_-12px_rgba(249,115,22,0.35)]",
    iconClasses: "bg-orange-500/15 text-orange-300 ring-orange-500/25",
  },
  {
    value: "accettato",
    label: "Accettate",
    icon: CheckCircle2,
    activeClasses:
      "ring-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_20px_45px_-12px_rgba(16,185,129,0.35)]",
    iconClasses: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  },
];

export function DashboardOverview({
  richieste,
  totaleFiltrato,
  pagina,
  totalePagine,
  q,
  stato,
  tipo,
  conteggiPerStato,
  totaleGlobale,
}: DashboardOverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(q);

  // Allinea l'input locale se l'URL cambia (es. tasto indietro del browser).
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  function navigate(next: { pagina?: number; q?: string; stato?: string; tipo?: string }) {
    const href = buildDashboardHref({
      pagina: next.pagina ?? 1,
      q: next.q ?? q,
      stato: next.stato ?? stato,
      tipo: next.tipo ?? tipo,
    });
    startTransition(() => {
      router.push(href);
    });
  }

  // Debounce della ricerca testuale: aggiorna l'URL (e riparte da pagina 1).
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === q) return;

    const timer = window.setTimeout(() => {
      const href = buildDashboardHref({
        pagina: 1,
        q: trimmed,
        stato,
        tipo,
      });
      startTransition(() => {
        router.push(href);
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput, q, stato, tipo, router]);

  function handleStatoSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    navigate({ pagina: 1, stato: event.target.value });
  }

  function handleTipoProgettoSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    navigate({ pagina: 1, tipo: event.target.value });
  }

  function toggleStatoCard(value: StatoRichiesta | "") {
    navigate({ pagina: 1, stato: stato === value ? "" : value });
  }

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((card) => {
          const count = card.value === "" ? totaleGlobale : conteggiPerStato[card.value] ?? 0;
          const isActive = stato === card.value;
          const Icon = card.icon;

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => toggleStatoCard(card.value)}
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
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface py-3 pl-9 pr-9 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2.5 sm:text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                navigate({ pagina: 1, q: "" });
              }}
              aria-label="Cancella ricerca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-brand-muted transition hover:text-brand-accent-light"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={tipo}
            onChange={handleTipoProgettoSelectChange}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:w-56 sm:py-2.5 sm:text-sm"
          >
            <option value="">Tutti i tipi di progetto</option>
            {TIPO_PROGETTO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={stato}
            onChange={handleStatoSelectChange}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:w-56 sm:py-2.5 sm:text-sm"
          >
            <option value="">Tutti gli stati</option>
            {STATO_OPTIONS.filter((option) => option.value !== "archiviato").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
        <RichiesteTable richieste={richieste} totale={totaleFiltrato} bare />
        <PaginazioneRichieste
          pagina={pagina}
          totalePagine={totalePagine}
          q={q}
          stato={stato}
          tipo={tipo}
        />
      </div>
    </div>
  );
}
