"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { TIPO_COLLABORATORE_OPTIONS, type TipoCollaboratore } from "@/lib/collaboratori/types";
import { createCollaboratore } from "../actions";

const INPUT =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";
const LABEL = "mb-1 block text-xs font-medium text-brand-soft";

export function NuovoCollaboratoreForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCollaboratore>("azienda");
  const [contatto, setContatto] = useState("");
  const [iban, setIban] = useState("");
  const [percentuale, setPercentuale] = useState("20");
  const [note, setNote] = useState("");

  function resetForm() {
    setNome("");
    setTipo("azienda");
    setContatto("");
    setIban("");
    setPercentuale("20");
    setNote("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const percentualeNumerica = Number(percentuale.replace(",", "."));
    if (!nome.trim()) {
      setErrorMessage("Inserisci il nome.");
      return;
    }
    if (Number.isNaN(percentualeNumerica) || percentualeNumerica < 0 || percentualeNumerica > 100) {
      setErrorMessage("La percentuale deve essere tra 0 e 100.");
      return;
    }

    startTransition(async () => {
      try {
        await createCollaboratore({
          nome: nome.trim(),
          tipo,
          contatto: contatto.trim() || null,
          iban: iban.trim() || null,
          percentuale: percentualeNumerica,
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
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
      >
        {isOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {isOpen ? "Chiudi" : "Nuovo collaboratore"}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="collab_nome" className={LABEL}>
                Nome
              </label>
              <input
                id="collab_nome"
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Es. Studio Rossi oppure Marco Bianchi"
                className={INPUT}
              />
            </div>
            <div>
              <span className={LABEL}>Tipo</span>
              <div className="flex flex-wrap gap-2">
                {TIPO_COLLABORATORE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTipo(option.value)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition ${
                      tipo === option.value
                        ? "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/40"
                        : "bg-brand-surface text-brand-muted ring-brand-border-strong hover:text-brand-soft"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="collab_percentuale" className={LABEL}>
                Percentuale di default (%)
              </label>
              <input
                id="collab_percentuale"
                type="text"
                inputMode="decimal"
                value={percentuale}
                onChange={(event) => setPercentuale(event.target.value)}
                placeholder="Es. 20"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="collab_contatto" className={LABEL}>
                Email / telefono
              </label>
              <input
                id="collab_contatto"
                type="text"
                value={contatto}
                onChange={(event) => setContatto(event.target.value)}
                placeholder="Opzionale"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="collab_iban" className={LABEL}>
                IBAN
              </label>
              <input
                id="collab_iban"
                type="text"
                value={iban}
                onChange={(event) => setIban(event.target.value)}
                placeholder="Per i bonifici"
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label htmlFor="collab_note" className={LABEL}>
              Note
            </label>
            <textarea
              id="collab_note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Accordi, ruoli, scadenze..."
              className={`${INPUT} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Salvataggio..." : "Salva collaboratore"}
          </button>
        </form>
      )}
    </div>
  );
}
