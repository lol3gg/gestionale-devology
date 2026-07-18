"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";
import { updateStato } from "../actions";

type ArchiviaRichiestaButtonProps = {
  richiestaId: string;
  statoCorrente: string;
};

/**
 * Sposta la richiesta in Archivio (stato "archiviato") senza eliminarla.
 * Resta consultabile da /dashboard/archivio.
 */
export function ArchiviaRichiestaButton({
  richiestaId,
  statoCorrente,
}: ArchiviaRichiestaButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (statoCorrente === "archiviato") {
    return (
      <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text">
          <Archive className="h-4 w-4 text-brand-muted" />
          Archivio
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          Questa richiesta è già in archivio. Puoi cambiarne lo stato dal selettore in alto per
          riportarla tra le richieste attive, oppure eliminarla definitivamente qui sotto.
        </p>
        <a
          href="/dashboard/archivio"
          className="mt-3 inline-flex text-xs font-semibold text-brand-accent-light hover:underline"
        >
          Vai all&apos;Archivio →
        </a>
      </section>
    );
  }

  function handleArchivia() {
    if (
      !window.confirm(
        "Archiviare questa richiesta? Non verrà eliminata: la troverai nella sezione Archivio della dashboard."
      )
    ) {
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        await updateStato(richiestaId, "archiviato");
        router.push("/dashboard/archivio?archiviata=1");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Errore durante l'archiviazione."
        );
      }
    });
  }

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
      <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text">
        <Archive className="h-4 w-4 text-brand-muted" />
        Archivia
      </h2>
      <p className="mt-1 text-sm text-brand-muted">
        Metti da parte questa richiesta senza cancellarla. Resterà disponibile nella sezione{" "}
        <span className="font-semibold text-brand-soft">Archivio</span> della dashboard.
      </p>
      {errorMessage && (
        <p className="mt-3 text-sm text-brand-accent-light">{errorMessage}</p>
      )}
      <button
        type="button"
        onClick={handleArchivia}
        disabled={isPending}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Archive className="h-3.5 w-3.5" />
        )}
        {isPending ? "Archiviazione..." : "Archivia richiesta"}
      </button>
    </section>
  );
}
