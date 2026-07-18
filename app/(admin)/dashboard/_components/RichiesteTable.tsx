"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, ChevronRight, SearchX, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDataBreve, formatEuro } from "@/lib/richieste/format";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";
import { StatoBadge } from "./StatoBadge";

export type RichiestaListItem = {
  id: string;
  nome: string;
  cognome: string;
  tipo_cliente: string;
  nome_azienda: string | null;
  budget: number | null;
  tempistiche: string | null;
  tipo_progetto: string | null;
  stato: string;
  created_at: string;
};

type RichiesteTableProps = {
  richieste: RichiestaListItem[];
  totale: number;
  /** Se true, non applica bordo/ombra esterni (usato quando la tabella è già dentro un wrapper). */
  bare?: boolean;
};

type BudgetSortDirection = "desc" | "asc" | null;

export function RichiesteTable({ richieste, totale, bare = false }: RichiesteTableProps) {
  const router = useRouter();
  const [budgetSort, setBudgetSort] = useState<BudgetSortDirection>(null);

  function toggleBudgetSort() {
    setBudgetSort((current) => (current === null ? "desc" : current === "desc" ? "asc" : null));
  }

  const righeOrdinate = useMemo(() => {
    if (!budgetSort) return richieste;

    return [...richieste].sort((a, b) => {
      const budgetA = a.budget ?? -Infinity;
      const budgetB = b.budget ?? -Infinity;
      return budgetSort === "desc" ? budgetB - budgetA : budgetA - budgetB;
    });
  }, [richieste, budgetSort]);

  const BudgetSortIcon = budgetSort === "desc" ? ArrowDown : budgetSort === "asc" ? ArrowUp : ArrowUpDown;

  return (
    <div
      className={
        bare
          ? "overflow-hidden"
          : "overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md"
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-surface/60">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Cliente
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Tipo
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <button
                  type="button"
                  onClick={toggleBudgetSort}
                  className="inline-flex items-center gap-1 transition hover:text-brand-text"
                >
                  Budget
                  <BudgetSortIcon className={`h-3 w-3 ${budgetSort ? "text-brand-accent-light" : ""}`} />
                </button>
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Tempistiche
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Tipo progetto
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Stato
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Data
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {righeOrdinate.length > 0 ? (
              righeOrdinate.map((richiesta) => {
                const nomeCompleto = `${richiesta.nome} ${richiesta.cognome}`.trim();
                const avatarClasses = getAvatarClasses(richiesta.id);

                return (
                  <tr
                    key={richiesta.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/${richiesta.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") router.push(`/dashboard/${richiesta.id}`);
                    }}
                    className="group cursor-pointer transition-colors hover:bg-brand-accent/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${avatarClasses}`}
                        >
                          {getInitials(richiesta.nome, richiesta.cognome)}
                        </span>
                        <span className="text-sm font-semibold text-brand-text">{nomeCompleto}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-soft">
                      <div className="flex items-center gap-1.5">
                        {richiesta.tipo_cliente === "azienda" ? (
                          <Building2 className="h-3.5 w-3.5 text-brand-muted" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-brand-muted" />
                        )}
                        {richiesta.tipo_cliente === "azienda" ? (
                          <>
                            Azienda
                            {richiesta.nome_azienda && (
                              <span className="text-brand-muted"> · {richiesta.nome_azienda}</span>
                            )}
                          </>
                        ) : (
                          "Privato"
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-brand-soft">
                      {richiesta.budget != null ? formatEuro(richiesta.budget) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-soft">
                      {richiesta.tempistiche ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-soft">
                      {richiesta.tipo_progetto ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                      <StatoBadge stato={richiesta.stato} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-muted">
                      {formatDataBreve(richiesta.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <ChevronRight className="h-4 w-4 text-brand-muted opacity-0 transition group-hover:opacity-100" />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
                      <SearchX className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-brand-soft">Nessuna richiesta trovata.</p>
                    {totale > 0 && (
                      <p className="text-xs text-brand-muted">
                        Prova a modificare la ricerca o i filtri applicati.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
