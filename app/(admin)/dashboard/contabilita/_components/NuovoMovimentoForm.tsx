"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { CATEGORIA_OPTIONS, type CategoriaMovimento, type TipoMovimento } from "@/lib/contabilita/categorie";
import { createMovimento } from "../actions";

type RichiestaOption = { id: string; nome: string; cognome: string };

const INPUT_CLASSES =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent";
const LABEL_CLASSES = "mb-1 block text-xs font-medium text-brand-soft";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function NuovoMovimentoForm({ richieste }: { richieste: RichiestaOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoMovimento>("entrata");
  const [categoria, setCategoria] = useState<CategoriaMovimento>(CATEGORIA_OPTIONS[0].value);
  const [descrizione, setDescrizione] = useState("");
  const [importo, setImporto] = useState("");
  const [data, setData] = useState(todayIsoDate());
  const [richiestaId, setRichiestaId] = useState("");
  const [note, setNote] = useState("");

  function resetForm() {
    setTipo("entrata");
    setCategoria(CATEGORIA_OPTIONS[0].value);
    setDescrizione("");
    setImporto("");
    setData(todayIsoDate());
    setRichiestaId("");
    setNote("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const importoNumerico = Number(importo.replace(",", "."));

    if (!descrizione.trim()) {
      setErrorMessage("Inserisci una descrizione.");
      return;
    }
    if (!importo || Number.isNaN(importoNumerico) || importoNumerico <= 0) {
      setErrorMessage("Inserisci un importo valido.");
      return;
    }
    if (!data) {
      setErrorMessage("Inserisci una data.");
      return;
    }

    startTransition(async () => {
      try {
        await createMovimento({
          tipo,
          categoria,
          descrizione: descrizione.trim(),
          importo: importoNumerico,
          data,
          richiesta_id: richiestaId || null,
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
        {isOpen ? "Chiudi" : "Nuovo movimento"}
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
              <span className={LABEL_CLASSES}>Tipo</span>
              <div className="flex gap-2">
                {(["entrata", "uscita"] as TipoMovimento[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTipo(option)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition ${
                      tipo === option
                        ? option === "entrata"
                          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
                          : "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/40"
                        : "bg-brand-surface text-brand-muted ring-brand-border-strong hover:text-brand-soft"
                    }`}
                  >
                    {option === "entrata" ? "Entrata" : "Uscita"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="categoria" className={LABEL_CLASSES}>
                Categoria
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value as CategoriaMovimento)}
                className={INPUT_CLASSES}
              >
                {CATEGORIA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="descrizione" className={LABEL_CLASSES}>
              Descrizione
            </label>
            <input
              id="descrizione"
              type="text"
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
              placeholder="Es. Vendita app gestione ordini"
              className={INPUT_CLASSES}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="importo" className={LABEL_CLASSES}>
                Importo (€)
              </label>
              <input
                id="importo"
                type="text"
                inputMode="decimal"
                value={importo}
                onChange={(event) => setImporto(event.target.value)}
                placeholder="Es. 450,00"
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label htmlFor="data" className={LABEL_CLASSES}>
                Data
              </label>
              <input
                id="data"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
          </div>

          <div>
            <label htmlFor="richiesta" className={LABEL_CLASSES}>
              Collega a una richiesta (opzionale)
            </label>
            <select
              id="richiesta"
              value={richiestaId}
              onChange={(event) => setRichiestaId(event.target.value)}
              className={INPUT_CLASSES}
            >
              <option value="">Nessun collegamento</option>
              {richieste.map((richiesta) => (
                <option key={richiesta.id} value={richiesta.id}>
                  {richiesta.nome} {richiesta.cognome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="note" className={LABEL_CLASSES}>
              Note (opzionali)
            </label>
            <textarea
              id="note"
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
            {isPending ? "Salvataggio..." : "Salva movimento"}
          </button>
        </form>
      )}
    </div>
  );
}
