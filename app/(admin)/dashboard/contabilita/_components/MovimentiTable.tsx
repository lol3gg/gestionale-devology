"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, SearchX, Trash2 } from "lucide-react";
import { getCategoriaLabel } from "@/lib/contabilita/categorie";
import { formatDataBreve, formatEuro } from "@/lib/contabilita/format";
import { deleteMovimento } from "../actions";

export type MovimentoItem = {
  id: string;
  tipo: "entrata" | "uscita";
  categoria: string;
  descrizione: string;
  importo: number;
  data: string;
  note: string | null;
  richiesta: { id: string; nome: string; cognome: string } | null;
};

function TipoBadge({ tipo }: { tipo: string }) {
  const isEntrata = tipo === "entrata";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        isEntrata
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
          : "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/30"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isEntrata ? "bg-emerald-400" : "bg-brand-accent-light"}`} />
      {isEntrata ? "Entrata" : "Uscita"}
    </span>
  );
}

export function MovimentiTable({ movimenti }: { movimenti: MovimentoItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(movimento: MovimentoItem) {
    if (!window.confirm(`Eliminare il movimento "${movimento.descrizione}"?`)) return;
    setDeletingId(movimento.id);
    startTransition(async () => {
      try {
        await deleteMovimento(movimento.id);
      } finally {
        setDeletingId(null);
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
                Data
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Tipo
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Categoria
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Descrizione
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Collegato a
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Importo
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {movimenti.length > 0 ? (
              movimenti.map((movimento) => (
                <tr key={movimento.id} className="transition-colors hover:bg-brand-accent/5">
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-muted">
                    {formatDataBreve(movimento.data)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                    <TipoBadge tipo={movimento.tipo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-soft">
                    {getCategoriaLabel(movimento.categoria)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-brand-text">
                    <p className="max-w-xs truncate">{movimento.descrizione}</p>
                    {movimento.note && <p className="mt-0.5 truncate text-xs text-brand-muted">{movimento.note}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                    {movimento.richiesta ? (
                      <Link
                        href={`/dashboard/${movimento.richiesta.id}`}
                        className="text-brand-soft underline-offset-2 transition hover:text-brand-accent-light hover:underline"
                      >
                        {movimento.richiesta.nome} {movimento.richiesta.cognome}
                      </Link>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold ${
                      movimento.tipo === "entrata" ? "text-emerald-300" : "text-brand-accent-light"
                    }`}
                  >
                    {movimento.tipo === "entrata" ? "+" : "-"}
                    {formatEuro(movimento.importo)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(movimento)}
                      disabled={isPending && deletingId === movimento.id}
                      aria-label={`Elimina ${movimento.descrizione}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light disabled:opacity-50"
                    >
                      {isPending && deletingId === movimento.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
                      <SearchX className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-brand-soft">Nessun movimento in questo mese.</p>
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
