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

function EmptyState({ totale }: { totale: number }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
        <SearchX className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-brand-soft">Nessuna richiesta trovata.</p>
      {totale > 0 && (
        <p className="text-xs text-brand-muted">Prova a modificare la ricerca o i filtri applicati.</p>
      )}
    </div>
  );
}

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

  function openRichiesta(id: string) {
    router.push(`/dashboard/${id}`);
  }

  return (
    <div
      className={
        bare
          ? "overflow-hidden"
          : "overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md"
      }
    >
      {/* Mobile: card list */}
      <div className="md:hidden">
        <div className="flex items-center justify-between border-b border-brand-border bg-brand-surface/60 px-4 py-3">
          <button
            type="button"
            onClick={toggleBudgetSort}
            className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted"
          >
            Ordina per budget
            <BudgetSortIcon className={`h-3.5 w-3.5 ${budgetSort ? "text-brand-accent-light" : ""}`} />
          </button>
          <span className="text-xs text-brand-muted">{righeOrdinate.length} risultati</span>
        </div>

        {righeOrdinate.length > 0 ? (
          <ul className="divide-y divide-brand-border">
            {righeOrdinate.map((richiesta) => {
              const nomeCompleto = `${richiesta.nome} ${richiesta.cognome}`.trim();
              const avatarClasses = getAvatarClasses(richiesta.id);

              return (
                <li key={richiesta.id}>
                  <button
                    type="button"
                    onClick={() => openRichiesta(richiesta.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-brand-accent/10"
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${avatarClasses}`}
                    >
                      {getInitials(richiesta.nome, richiesta.cognome)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-brand-text">{nomeCompleto}</span>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" />
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-muted">
                        <span className="inline-flex items-center gap-1">
                          {richiesta.tipo_cliente === "azienda" ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {richiesta.tipo_cliente === "azienda"
                            ? richiesta.nome_azienda || "Azienda"
                            : "Privato"}
                        </span>
                        <span>·</span>
                        <span>{formatDataBreve(richiesta.created_at)}</span>
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <StatoBadge stato={richiesta.stato} />
                        <span className="text-xs font-semibold text-brand-soft">
                          {richiesta.budget != null ? formatEuro(richiesta.budget) : "Budget —"}
                        </span>
                        {richiesta.tipo_progetto && (
                          <span className="truncate text-xs text-brand-muted">{richiesta.tipo_progetto}</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState totale={totale} />
        )}
      </div>

      {/* Desktop: tabella */}
      <div className="hidden overflow-x-auto md:block">
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
                    onClick={() => openRichiesta(richiesta.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openRichiesta(richiesta.id);
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
                <td colSpan={8}>
                  <EmptyState totale={totale} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
