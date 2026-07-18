"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildDashboardHref } from "@/lib/richieste/dashboardQuery";

type PaginazioneRichiesteProps = {
  pagina: number;
  totalePagine: number;
  q: string;
  stato: string;
  tipo: string;
};

export function PaginazioneRichieste({
  pagina,
  totalePagine,
  q,
  stato,
  tipo,
}: PaginazioneRichiesteProps) {
  if (totalePagine <= 1) return null;

  const prevHref = buildDashboardHref({
    pagina: pagina - 1,
    q,
    stato,
    tipo,
  });
  const nextHref = buildDashboardHref({
    pagina: pagina + 1,
    q,
    stato,
    tipo,
  });

  const canPrev = pagina > 1;
  const canNext = pagina < totalePagine;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-brand-border bg-brand-surface/40 px-4 py-3 sm:flex-row">
      <p className="text-xs font-medium text-brand-muted">
        Pagina {pagina} di {totalePagine}
      </p>
      <div className="flex items-center gap-2">
        {canPrev ? (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Precedente
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-brand-border/60 bg-brand-elevated/50 px-3 py-1.5 text-xs font-semibold text-brand-muted opacity-50">
            <ChevronLeft className="h-3.5 w-3.5" />
            Precedente
          </span>
        )}
        {canNext ? (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light"
          >
            Successiva
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-brand-border/60 bg-brand-elevated/50 px-3 py-1.5 text-xs font-semibold text-brand-muted opacity-50">
            Successiva
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
