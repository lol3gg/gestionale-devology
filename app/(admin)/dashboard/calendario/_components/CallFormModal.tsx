"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";
import {
  CALL_DURATA_DEFAULT,
  CALL_DURATE,
  durataCall,
  formatGiornoCompleto,
  normalizzaOra,
  oraFineCall,
} from "@/lib/calendario/date";
import type { CallAppuntamento, CallAppuntamentoInput } from "@/lib/calendario/types";
import type { CallActionResult } from "@/lib/calendario/store";
import { refreshTutti } from "@/lib/live/browser";
import { createCall, deleteCall, updateCall } from "../actions";

const INPUT =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";
const LABEL = "mb-1 block text-xs font-medium text-brand-soft";

export type CallFormDraft = {
  id?: string;
  giorno: string;
  ora: string;
  durataMinuti: number;
  azienda: string;
  email: string;
  telefono: string;
  attivita: string;
};

type CallFormModalProps = {
  draft: CallFormDraft;
  onClose: () => void;
  onSaved: (result: CallActionResult & { ok: true }) => void;
};

export function callToDraft(call: CallAppuntamento): CallFormDraft {
  return {
    id: call.id,
    giorno: call.giorno,
    ora: normalizzaOra(call.ora),
    durataMinuti: durataCall(call.durataMinuti),
    azienda: call.azienda,
    email: call.email ?? "",
    telefono: call.telefono ?? "",
    attivita: call.attivita ?? "",
  };
}

export function CallFormModal({ draft, onClose, onSaved }: CallFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [giorno, setGiorno] = useState(draft.giorno);
  const [ora, setOra] = useState(normalizzaOra(draft.ora));
  const [durataMinuti, setDurataMinuti] = useState(durataCall(draft.durataMinuti ?? CALL_DURATA_DEFAULT));
  const [azienda, setAzienda] = useState(draft.azienda);
  const [email, setEmail] = useState(draft.email);
  const [telefono, setTelefono] = useState(draft.telefono);
  const [attivita, setAttivita] = useState(draft.attivita);

  const isEdit = Boolean(draft.id);
  const oraFine = oraFineCall(ora, durataMinuti);

  function payload(): CallAppuntamentoInput {
    return {
      giorno,
      ora,
      durataMinuti,
      azienda,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      attivita: attivita.trim() || null,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = draft.id
          ? await updateCall(draft.id, payload())
          : await createCall(payload());
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }
        onSaved(
          result.call || result.deletedId
            ? result
            : {
                ok: true,
                call: {
                  id: draft.id ?? crypto.randomUUID(),
                  ...payload(),
                  ora: normalizzaOra(payload().ora),
                  durataMinuti: durataCall(payload().durataMinuti),
                },
              }
        );
        onClose();
        refreshTutti(router);
      } catch {
        setErrorMessage("Errore nel salvataggio.");
      }
    });
  }

  function handleDelete() {
    if (!draft.id) return;
    if (!window.confirm(`Eliminare la call con ${draft.azienda || "questa azienda"}?`)) return;
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await deleteCall(draft.id as string);
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }
        onSaved(result);
        onClose();
        refreshTutti(router);
      } catch {
        setErrorMessage("Errore nell'eliminazione.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Chiudi"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-brand-lg border border-brand-border bg-brand-elevated p-5 shadow-brand-lg sm:max-w-lg sm:rounded-brand-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
              {isEdit ? "Modifica call" : "Nuova call"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-brand-text">
              {formatGiornoCompleto(giorno || draft.giorno)} · {ora || draft.ora}–{oraFine}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-brand-muted hover:text-brand-text"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <p className="mb-3 rounded-md border border-brand-accent/40 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent-light">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={LABEL}>Giorno</span>
            <input
              type="date"
              required
              value={giorno}
              onChange={(event) => setGiorno(event.target.value)}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Inizio</span>
            <input
              type="time"
              required
              value={ora}
              onChange={(event) => setOra(event.target.value)}
              className={INPUT}
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className={LABEL}>Durata</span>
          <select
            value={durataMinuti}
            onChange={(event) => setDurataMinuti(Number(event.target.value))}
            className={INPUT}
          >
            {CALL_DURATE.map((durata) => (
              <option key={durata} value={durata}>
                {durata} minuti{durata === CALL_DURATA_DEFAULT ? " (consigliata)" : ""}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-brand-muted">
            Termina alle <span className="font-semibold text-brand-text">{oraFine}</span>. Se si
            sovrappone a un&apos;altra call, il salvataggio viene bloccato.
          </span>
        </label>

        <label className="mt-3 block">
          <span className={LABEL}>Nome azienda *</span>
          <input
            type="text"
            required
            value={azienda}
            onChange={(event) => setAzienda(event.target.value)}
            placeholder="Es. Coedil 99 srl"
            className={INPUT}
            autoFocus
          />
        </label>

        <label className="mt-3 block">
          <span className={LABEL}>Email (facoltativa)</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="es. mario@azienda.it"
            className={INPUT}
          />
        </label>

        <label className="mt-3 block">
          <span className={LABEL}>Numero cellulare (facoltativo)</span>
          <input
            type="tel"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            placeholder="Es. 333 123 4567"
            className={INPUT}
          />
        </label>

        <label className="mt-3 block">
          <span className={LABEL}>Cosa fanno (facoltativo)</span>
          <textarea
            value={attivita}
            onChange={(event) => setAttivita(event.target.value)}
            placeholder="Es. impresa edile, software house…"
            rows={3}
            className={`${INPUT} resize-y`}
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-3.5 py-2 text-sm font-semibold text-brand-muted hover:border-brand-accent/40 hover:text-brand-accent-light"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Elimina
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-soft"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Salva" : "Fissa call"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
