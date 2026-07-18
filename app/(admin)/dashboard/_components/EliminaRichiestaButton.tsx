"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { eliminaRichiesta } from "../actions";

type EliminaRichiestaButtonProps = {
  richiestaId: string;
  nomeCliente: string;
};

export function EliminaRichiestaButton({
  richiestaId,
  nomeCliente,
}: EliminaRichiestaButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await eliminaRichiesta(richiestaId);
        // In caso di successo la server action fa redirect.
      } catch (error) {
        // Next.js usa un throw speciale per redirect(): va rilanciato, non trattato come errore UI.
        if (
          error &&
          typeof error === "object" &&
          "digest" in error &&
          typeof (error as { digest?: string }).digest === "string" &&
          (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          throw error;
        }
        setErrorMessage(
          error instanceof Error ? error.message : "Errore durante l'eliminazione."
        );
      }
    });
  }

  return (
    <>
      <section className="rounded-brand-lg border border-red-500/30 bg-red-500/[0.06] p-6 shadow-brand-md">
        <h2 className="flex items-center gap-2 text-base font-semibold text-red-300">
          <AlertTriangle className="h-4 w-4" />
          Zona pericolosa
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          L&apos;eliminazione è permanente: non è un archivio. Allegati e preventivi collegati
          verranno rimossi insieme alla richiesta.
        </p>
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setIsOpen(true);
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Elimina definitivamente
        </button>
      </section>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="elimina-richiesta-title"
        >
          <div className="w-full max-w-md rounded-brand-lg border border-red-500/40 bg-brand-elevated p-6 shadow-brand-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3
              id="elimina-richiesta-title"
              className="mt-4 text-lg font-bold tracking-[-0.02em] text-brand-text"
            >
              Eliminare {nomeCliente}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Questa azione è irreversibile. Verranno eliminati anche tutti gli allegati e i
              preventivi collegati a questa richiesta. Confermi?
            </p>

            {errorMessage && (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {errorMessage}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light disabled:opacity-60"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {isPending ? "Eliminazione..." : "Sì, elimina definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
