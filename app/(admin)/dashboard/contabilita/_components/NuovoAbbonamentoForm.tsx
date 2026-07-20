"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createAbbonamento } from "../actions";

const INPUT_CLASSES =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";
const LABEL_CLASSES = "mb-1 block text-xs font-medium text-brand-soft";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function NuovoAbbonamentoForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [costoMensile, setCostoMensile] = useState("");
  const [categoria, setCategoria] = useState("");
  const [dataInizio, setDataInizio] = useState(todayIsoDate());
  const [note, setNote] = useState("");

  function resetForm() {
    setNome("");
    setCostoMensile("");
    setCategoria("");
    setDataInizio(todayIsoDate());
    setNote("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const costoNumerico = Number(costoMensile.replace(",", "."));

    if (!nome.trim()) {
      setErrorMessage("Inserisci il nome dell'abbonamento.");
      return;
    }
    if (!costoMensile || Number.isNaN(costoNumerico) || costoNumerico <= 0) {
      setErrorMessage("Inserisci un costo mensile valido.");
      return;
    }

    startTransition(async () => {
      try {
        await createAbbonamento({
          nome: nome.trim(),
          costo_mensile: costoNumerico,
          categoria: categoria.trim() || null,
          data_inizio: dataInizio || null,
          note: note.trim() || null,
        });
        resetForm();
        setIsOpen(false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Errore nel salvataggio.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-soft shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light"
      >
        {isOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {isOpen ? "Chiudi" : "Nuovo abbonamento"}
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-4 space-y-3 rounded-brand-lg border border-brand-border bg-brand-elevated p-5 shadow-brand-md"
        >
          {errorMessage && (
            <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-2.5 text-xs text-brand-accent-light">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="nome_abbonamento" className={LABEL_CLASSES}>
              Nome
            </label>
            <input
              id="nome_abbonamento"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Es. Vercel Pro"
              className={INPUT_CLASSES}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="costo_mensile" className={LABEL_CLASSES}>
                Costo mensile (€)
              </label>
              <input
                id="costo_mensile"
                type="text"
                inputMode="decimal"
                value={costoMensile}
                onChange={(event) => setCostoMensile(event.target.value)}
                placeholder="Es. 20,00"
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label htmlFor="data_inizio" className={LABEL_CLASSES}>
                Data inizio
              </label>
              <input
                id="data_inizio"
                type="date"
                value={dataInizio}
                onChange={(event) => setDataInizio(event.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
          </div>

          <div>
            <label htmlFor="categoria_abbonamento" className={LABEL_CLASSES}>
              Categoria (opzionale)
            </label>
            <input
              id="categoria_abbonamento"
              type="text"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              placeholder="Es. Hosting, Design, Marketing..."
              className={INPUT_CLASSES}
            />
          </div>

          <div>
            <label htmlFor="note_abbonamento" className={LABEL_CLASSES}>
              Note (opzionali)
            </label>
            <textarea
              id="note_abbonamento"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Annotazioni aggiuntive..."
              className={`${INPUT_CLASSES} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Salvataggio..." : "Salva abbonamento"}
          </button>
        </form>
      )}
    </div>
  );
}
