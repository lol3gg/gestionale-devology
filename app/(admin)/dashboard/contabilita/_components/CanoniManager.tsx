"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { formatDataBreve, formatEuro } from "@/lib/contabilita/format";
import { importoMensileCanone, type CanoneCliente } from "@/lib/contabilita/canoni";
import { deleteCanone, toggleCanone } from "../actions";

export function CanoniManager({ canoni }: { canoni: CanoneCliente[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const totaleMensile = canoni
    .filter((canone) => canone.attivo)
    .reduce((sum, canone) => sum + importoMensileCanone(canone), 0);

  function run(id: string, action: () => Promise<void>) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await action();
      } finally {
        setPendingId(null);
      }
    });
  }

  if (canoni.length === 0) {
    return (
      <p className="rounded-brand-lg border border-brand-border bg-brand-elevated px-4 py-10 text-center text-sm text-brand-muted shadow-brand-md">
        Nessun canone di assistenza. Aggiungine uno se un cliente paga ogni mese per tenere il
        sistema attivo.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
      <ul className="divide-y divide-brand-border">
        {canoni.map((canone) => {
          const mensile = importoMensileCanone(canone);
          const pending = isPending && pendingId === canone.id;
          return (
            <li
              key={canone.id}
              className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                canone.attivo ? "" : "opacity-55"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-text">{canone.nome}</p>
                <p className="mt-1 text-xs text-brand-muted">
                  {canone.tipo === "percentuale"
                    ? `${canone.percentuale}% su ${formatEuro(Number(canone.base_importo ?? 0))} / mese`
                    : "Quota fissa mensile"}
                  {canone.data_inizio ? ` · dal ${formatDataBreve(canone.data_inizio)}` : ""}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="text-sm font-bold text-emerald-300">
                  {formatEuro(mensile)}
                  <span className="ml-1 text-xs font-medium text-brand-muted">/ mese</span>
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={canone.attivo}
                  onClick={() => run(canone.id, () => toggleCanone(canone.id, !canone.attivo))}
                  disabled={pending}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition disabled:opacity-50 ${
                    canone.attivo ? "bg-emerald-500/70" : "bg-brand-border-strong"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                      canone.attivo ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`Eliminare il canone "${canone.nome}"?`)) return;
                    run(canone.id, () => deleteCanone(canone.id));
                  }}
                  className="rounded-lg p-2 text-brand-muted hover:text-brand-accent-light"
                  aria-label={`Elimina ${canone.nome}`}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-brand-border bg-brand-surface/60 px-4 py-3">
        <span className="text-xs font-semibold text-brand-soft">Totale mensile canoni attivi</span>
        <span className="text-sm font-bold text-emerald-300">{formatEuro(totaleMensile)}</span>
      </div>
    </div>
  );
}
