"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Archive, Search, SearchX, X } from "lucide-react";
import { TIPO_PROGETTO_OPTIONS } from "@/lib/richieste/progetto";
import { RichiesteTable, type RichiestaListItem } from "./RichiesteTable";
import { PaginazioneArchivio } from "./PaginazioneArchivio";

type ArchivioOverviewProps = {
  richieste: RichiestaListItem[];
  totaleFiltrato: number;
  pagina: number;
  totalePagine: number;
  q: string;
  tipo: string;
};

function buildArchivioHref(params: { pagina?: number; q?: string; tipo?: string }) {
  const search = new URLSearchParams();
  if (params.pagina && params.pagina > 1) search.set("pagina", String(params.pagina));
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.tipo) search.set("tipo", params.tipo);
  const qs = search.toString();
  return qs ? `/dashboard/archivio?${qs}` : "/dashboard/archivio";
}

export function ArchivioOverview({
  richieste,
  totaleFiltrato,
  pagina,
  totalePagine,
  q,
  tipo,
}: ArchivioOverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  function navigate(next: { pagina?: number; q?: string; tipo?: string }) {
    const href = buildArchivioHref({
      pagina: next.pagina ?? 1,
      q: next.q ?? q,
      tipo: next.tipo ?? tipo,
    });
    startTransition(() => {
      router.push(href);
    });
  }

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === q) return;
    const timer = window.setTimeout(() => {
      navigate({ pagina: 1, q: trimmed });
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, q, tipo, router]);

  function handleTipoChange(event: ChangeEvent<HTMLSelectElement>) {
    navigate({ pagina: 1, tipo: event.target.value });
  }

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Cerca nell'archivio..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface py-2.5 pl-9 pr-9 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
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

        <select
          value={tipo}
          onChange={handleTipoChange}
          className="w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:w-56"
        >
          <option value="">Tutti i tipi di progetto</option>
          {TIPO_PROGETTO_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs font-medium text-brand-muted">
        {totaleFiltrato === 0
          ? "Nessuna richiesta in archivio."
          : `${totaleFiltrato} richiest${totaleFiltrato === 1 ? "a" : "e"} in archivio`}
      </p>

      <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
        {richieste.length === 0 && totaleFiltrato === 0 && !q && !tipo ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
              <Archive className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-brand-soft">L&apos;archivio è vuoto</p>
            <p className="max-w-sm text-xs text-brand-muted">
              Quando archivi una richiesta dal dettaglio, la ritrovi qui con la dicitura Archivio.
            </p>
          </div>
        ) : richieste.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
              <SearchX className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-brand-soft">Nessun risultato</p>
            <p className="text-xs text-brand-muted">Prova a modificare la ricerca o i filtri.</p>
          </div>
        ) : (
          <RichiesteTable richieste={richieste} totale={totaleFiltrato} bare />
        )}

        <PaginazioneArchivio
          pagina={pagina}
          totalePagine={totalePagine}
          q={q}
          tipo={tipo}
        />
      </div>
    </div>
  );
}
