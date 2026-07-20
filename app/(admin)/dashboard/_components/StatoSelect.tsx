"use client";

import { useState, type ChangeEvent } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { STATO_OPTIONS, type StatoRichiesta } from "@/lib/richieste/stato";
import { updateStato } from "../actions";

type StatoSelectProps = {
  richiestaId: string;
  statoIniziale: string;
};

export function StatoSelect({ richiestaId, statoIniziale }: StatoSelectProps) {
  const [stato, setStato] = useState(statoIniziale);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nuovoStato = event.target.value as StatoRichiesta;
    setStato(nuovoStato);
    setIsSaving(true);
    setIsSaved(false);
    setErrorMessage(null);

    try {
      await updateStato(richiestaId, nuovoStato);
      setIsSaved(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Errore nel salvataggio.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
      <span className="text-xs font-medium uppercase tracking-wide text-brand-muted">
        Stato richiesta
      </span>
      <div className="relative w-full sm:w-auto">
        <select
          value={stato}
          onChange={handleChange}
          disabled={isSaving}
          className="w-full appearance-none rounded-xl border border-brand-border-strong bg-brand-surface px-3.5 py-3 pr-9 text-sm font-semibold text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-60 sm:w-auto sm:py-2.5"
        >
          {STATO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isSaving ? (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-muted" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        )}
      </div>
      {!isSaving && isSaved && <span className="text-xs text-emerald-400">Stato salvato</span>}
      {errorMessage && <span className="text-xs text-brand-accent-light">{errorMessage}</span>}
    </div>
  );
}
