"use client";

import { useState, type ChangeEvent } from "react";
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
    <div className="flex flex-col items-end gap-1">
      <select
        value={stato}
        onChange={handleChange}
        disabled={isSaving}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        {STATO_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isSaving && <span className="text-xs text-gray-400">Salvataggio...</span>}
      {!isSaving && isSaved && <span className="text-xs text-green-600">Stato salvato</span>}
      {errorMessage && <span className="text-xs text-red-600">{errorMessage}</span>}
    </div>
  );
}
