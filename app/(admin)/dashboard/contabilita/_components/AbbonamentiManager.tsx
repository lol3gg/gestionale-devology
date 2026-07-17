"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { formatDataBreve, formatEuro } from "@/lib/contabilita/format";
import { deleteAbbonamento, toggleAbbonamento } from "../actions";

export type AbbonamentoItem = {
  id: string;
  nome: string;
  costo_mensile: number;
  categoria: string | null;
  attivo: boolean;
  data_inizio: string | null;
};

export function AbbonamentiManager({ abbonamenti }: { abbonamenti: AbbonamentoItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const totaleMensile = abbonamenti
    .filter((abbonamento) => abbonamento.attivo)
    .reduce((sum, abbonamento) => sum + abbonamento.costo_mensile, 0);

  function handleToggle(abbonamento: AbbonamentoItem) {
    setPendingId(abbonamento.id);
    startTransition(async () => {
      try {
        await toggleAbbonamento(abbonamento.id, !abbonamento.attivo);
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDelete(abbonamento: AbbonamentoItem) {
    if (!window.confirm(`Eliminare definitivamente l'abbonamento "${abbonamento.nome}"? L'operazione non è reversibile.`)) {
      return;
    }
    setPendingId(abbonamento.id);
    startTransition(async () => {
      try {
        await deleteAbbonamento(abbonamento.id);
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-surface/60">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Nome
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Categoria
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Data inizio
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Costo mensile
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Stato
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {abbonamenti.length > 0 ? (
              abbonamenti.map((abbonamento) => {
                const isRowPending = isPending && pendingId === abbonamento.id;
                return (
                  <tr
                    key={abbonamento.id}
                    className={`transition-colors hover:bg-brand-accent/5 ${
                      !abbonamento.attivo ? "opacity-50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-brand-text">
                      {abbonamento.nome}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-soft">
                      {abbonamento.categoria ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-muted">
                      {abbonamento.data_inizio ? formatDataBreve(abbonamento.data_inizio) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-brand-text">
                      {formatEuro(abbonamento.costo_mensile)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={abbonamento.attivo}
                        aria-label={abbonamento.attivo ? "Disattiva abbonamento" : "Attiva abbonamento"}
                        onClick={() => handleToggle(abbonamento)}
                        disabled={isRowPending}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                          abbonamento.attivo ? "bg-emerald-500/70" : "bg-brand-border-strong"
                        }`}
                      >
                        <span
                          className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition ${
                            abbonamento.attivo ? "translate-x-[1.4rem]" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(abbonamento)}
                        disabled={isRowPending}
                        aria-label={`Elimina ${abbonamento.nome}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light disabled:opacity-50"
                      >
                        {isRowPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-muted">
                  Nessun abbonamento registrato.
                </td>
              </tr>
            )}
          </tbody>
          {abbonamenti.length > 0 && (
            <tfoot>
              <tr className="border-t border-brand-border bg-brand-surface/60">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-brand-soft">
                  Totale mensile abbonamenti attivi
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-brand-text">
                  {formatEuro(totaleMensile)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
