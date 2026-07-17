"use client";

import { useState } from "react";
import { NotebookPen, Save, Check } from "lucide-react";
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
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
      <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text">
        <NotebookPen className="h-4 w-4 text-brand-accent-light" />
        Note interne
      </h2>
      <p className="mt-1 text-xs text-brand-muted">Visibili solo al team, non al cliente.</p>
      <textarea
        rows={8}
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setIsSaved(false);
        }}
        placeholder="Annotazioni visibili solo al team..."
        className="mt-3 w-full resize-y rounded-xl border border-brand-border-strong bg-brand-surface px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "Salvataggio..." : "Salva note"}
        </button>
        {!isSaving && isSaved && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Note salvate
          </span>
        )}
        {errorMessage && <span className="text-xs text-brand-accent-light">{errorMessage}</span>}
      </div>
    </section>
  );
}
