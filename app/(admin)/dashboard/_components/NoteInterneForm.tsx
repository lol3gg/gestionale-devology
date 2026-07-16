"use client";

import { useState } from "react";
import { updateNoteInterne } from "../actions";

type NoteInterneFormProps = {
  richiestaId: string;
  noteIniziali: string;
};

export function NoteInterneForm({ richiestaId, noteIniziali }: NoteInterneFormProps) {
  const [note, setNote] = useState(noteIniziali);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateNoteInterne(richiestaId, note);
      setIsSaved(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Errore nel salvataggio.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Note interne</h2>
      <textarea
        rows={8}
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setIsSaved(false);
        }}
        placeholder="Annotazioni visibili solo al team..."
        className="mt-3 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Salvataggio..." : "Salva note"}
        </button>
        {!isSaving && isSaved && <span className="text-xs text-green-600">Note salvate</span>}
        {errorMessage && <span className="text-xs text-red-600">{errorMessage}</span>}
      </div>
    </section>
  );
}
