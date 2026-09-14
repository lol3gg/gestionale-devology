"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createCanone } from "../actions";
import type { TipoCanone } from "@/lib/contabilita/canoni";

const INPUT =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";
const LABEL = "mb-1 block text-xs font-medium text-brand-soft";

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function NuovoCanoneForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCanone>("quota");
  const [importo, setImporto] = useState("");
  const [percentuale, setPercentuale] = useState("");
  const [base, setBase] = useState("");
  const [dataInizio, setDataInizio] = useState(todayIsoDate());
  const [note, setNote] = useState("");

  function resetForm() {
    setNome("");
    setTipo("quota");
    setImporto("");
    setPercentuale("");
    setBase("");
    setDataInizio(todayIsoDate());
    setNote("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!nome.trim()) {
      setErrorMessage("Inserisci il cliente o il nome del canone.");
      return;
    }

    let importoMensile = 0;
    let pct: number | null = null;
    let baseImporto: number | null = null;

    if (tipo === "quota") {
      importoMensile = Number(importo.replace(",", "."));
      if (!importo || Number.isNaN(importoMensile) || importoMensile <= 0) {
        setErrorMessage("Inserisci la quota mensile.");
        return;
      }
    } else {
      pct = Number(percentuale.replace(",", "."));
      baseImporto = Number(base.replace(",", "."));
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
        setErrorMessage("La percentuale deve essere tra 0 e 100.");
        return;
      }
      if (Number.isNaN(baseImporto) || baseImporto <= 0) {
        setErrorMessage("Inserisci l'importo su cui calcolare la percentuale (es. prezzo del progetto).");
        return;
      }
      importoMensile = Math.round(((baseImporto * pct) / 100) * 100) / 100;
    }

    startTransition(async () => {
      try {
        await createCanone({
          nome: nome.trim(),
          tipo,
          importo_mensile: importoMensile,
          percentuale: pct,
          base_importo: baseImporto,
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
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 shadow-sm transition hover:bg-emerald-500/15"
      >
        {isOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {isOpen ? "Chiudi" : "Nuovo canone / assistenza"}
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

          <p className="text-xs text-brand-muted">
            Quota fissa mensile oppure percentuale sul progetto, per tenere il sistema attivo e
            l&apos;assistenza.
          </p>

          <div>
            <label htmlFor="canone_nome" className={LABEL}>
              Cliente / nome
            </label>
            <input
              id="canone_nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Es. Coedil 99 — assistenza sito"
              className={INPUT}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo("quota")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                tipo === "quota"
                  ? "bg-emerald-600 text-white"
                  : "bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border"
              }`}
            >
              Quota fissa
            </button>
            <button
              type="button"
              onClick={() => setTipo("percentuale")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                tipo === "percentuale"
                  ? "bg-emerald-600 text-white"
                  : "bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border"
              }`}
            >
              Percentuale mensile
            </button>
          </div>

          {tipo === "quota" ? (
            <div>
              <label htmlFor="canone_importo" className={LABEL}>
                Quota mensile (€)
              </label>
              <input
                id="canone_importo"
                value={importo}
                onChange={(event) => setImporto(event.target.value)}
                inputMode="decimal"
                placeholder="Es. 150"
                className={INPUT}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="canone_pct" className={LABEL}>
                  Percentuale mensile (%)
                </label>
                <input
                  id="canone_pct"
                  value={percentuale}
                  onChange={(event) => setPercentuale(event.target.value)}
                  inputMode="decimal"
                  placeholder="Es. 10"
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="canone_base" className={LABEL}>
                  Su quale importo (€)
                </label>
                <input
                  id="canone_base"
                  value={base}
                  onChange={(event) => setBase(event.target.value)}
                  inputMode="decimal"
                  placeholder="Es. 5000"
                  className={INPUT}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="canone_data" className={LABEL}>
              Data inizio
            </label>
            <input
              id="canone_data"
              type="date"
              value={dataInizio}
              onChange={(event) => setDataInizio(event.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="canone_note" className={LABEL}>
              Note (opzionali)
            </label>
            <textarea
              id="canone_note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={`${INPUT} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salva canone
          </button>
        </form>
      )}
    </div>
  );
}
