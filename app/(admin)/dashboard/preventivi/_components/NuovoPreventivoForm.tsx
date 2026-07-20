"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  STATO_PREVENTIVO_DEFAULT,
  STATO_PREVENTIVO_OPTIONS,
  type StatoPreventivo,
} from "@/lib/preventivi/stato";

const BUCKET = "preventivi-clienti";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 365 * 10;

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildNumeroPreventivo(dataInvio: string) {
  const short = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `PRV-${dataInvio.replace(/-/g, "")}-${short}`;
}

const INPUT =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";

export function NuovoPreventivoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [azienda, setAzienda] = useState("");
  const [dataInvio, setDataInvio] = useState(todayIsoDate());
  const [prezzo, setPrezzo] = useState("");
  const [stato, setStato] = useState<StatoPreventivo>(STATO_PREVENTIVO_DEFAULT);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const isPdf = selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMessage("Il preventivo deve essere un file PDF.");
      setFile(null);
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Il file supera la dimensione massima di 15MB.");
      setFile(null);
      event.target.value = "";
      return;
    }

    setFile(selected);
  }

  function resetForm() {
    setNome("");
    setCognome("");
    setAzienda("");
    setDataInvio(todayIsoDate());
    setPrezzo("");
    setStato(STATO_PREVENTIVO_DEFAULT);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nome.trim()) {
      setErrorMessage("Inserisci il nome.");
      return;
    }
    if (!cognome.trim()) {
      setErrorMessage("Inserisci il cognome.");
      return;
    }
    if (!dataInvio) {
      setErrorMessage("Inserisci la data.");
      return;
    }

    const prezzoNumber = prezzo.trim() === "" ? null : Number(prezzo.replace(",", "."));
    if (prezzo.trim() !== "" && (prezzoNumber == null || Number.isNaN(prezzoNumber) || prezzoNumber < 0)) {
      setErrorMessage("Inserisci un prezzo valido.");
      return;
    }

    if (!file) {
      setErrorMessage("Allega il PDF del preventivo.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const storagePath = `standalone/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      contentType: "application/pdf",
    });

    if (uploadError) {
      setErrorMessage(`Errore nel caricamento del file: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);
    const urlFile = signedUrlData?.signedUrl ?? "";

    const { error: insertError } = await supabase.from("preventivi").insert({
      richiesta_id: null,
      nome: nome.trim(),
      cognome: cognome.trim(),
      azienda: azienda.trim() || null,
      data_invio: dataInvio,
      prezzo: prezzoNumber,
      stato,
      numero_preventivo: buildNumeroPreventivo(dataInvio),
      nome_file: file.name,
      url_file: urlFile,
    });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      setErrorMessage(insertError.message);
      setIsUploading(false);
      return;
    }

    resetForm();
    setSuccessMessage("Preventivo creato.");
    setIsUploading(false);
    setIsOpen(false);
    router.refresh();
  }

  if (!isOpen) {
    return (
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsOpen(true);
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-3 text-sm font-semibold text-white shadow-brand-md transition hover:brightness-110 sm:w-auto sm:py-2.5"
        >
          <Plus className="h-4 w-4" />
          Nuovo preventivo
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-text">Nuovo preventivo</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Crea un preventivo con prezzo, stato e PDF. L&apos;azienda è opzionale.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsOpen(false);
          }}
          aria-label="Chiudi form"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border text-brand-muted transition hover:border-brand-accent/40 hover:text-brand-accent-light"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {errorMessage && (
          <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-2.5 text-xs text-brand-accent-light">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="prev_nome" className="mb-1 block text-xs font-medium text-brand-soft">
              Nome <span className="text-brand-accent-light">*</span>
            </label>
            <input
              id="prev_nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="prev_cognome" className="mb-1 block text-xs font-medium text-brand-soft">
              Cognome <span className="text-brand-accent-light">*</span>
            </label>
            <input
              id="prev_cognome"
              type="text"
              value={cognome}
              onChange={(event) => setCognome(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="prev_data" className="mb-1 block text-xs font-medium text-brand-soft">
              Data <span className="text-brand-accent-light">*</span>
            </label>
            <input
              id="prev_data"
              type="date"
              value={dataInvio}
              onChange={(event) => setDataInvio(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="prev_azienda" className="mb-1 block text-xs font-medium text-brand-soft">
              Azienda <span className="text-brand-muted">(opzionale)</span>
            </label>
            <input
              id="prev_azienda"
              type="text"
              value={azienda}
              onChange={(event) => setAzienda(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="prev_prezzo" className="mb-1 block text-xs font-medium text-brand-soft">
              Prezzo €
            </label>
            <input
              id="prev_prezzo"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="Es. 1500"
              value={prezzo}
              onChange={(event) => setPrezzo(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="prev_stato" className="mb-1 block text-xs font-medium text-brand-soft">
              Stato
            </label>
            <select
              id="prev_stato"
              value={stato}
              onChange={(event) => setStato(event.target.value as StatoPreventivo)}
              className={INPUT}
            >
              {STATO_PREVENTIVO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="prev_file" className="mb-1 block text-xs font-medium text-brand-soft">
            Allegato PDF <span className="text-brand-accent-light">*</span>
          </label>
          <input
            ref={fileInputRef}
            id="prev_file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-surface file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-soft hover:file:bg-brand-border-strong"
          />
          {file && (
            <p className="mt-1.5 truncate text-xs text-brand-muted">Selezionato: {file.name}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" />
            )}
            {isUploading ? "Salvataggio..." : "Crea preventivo"}
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setErrorMessage(null);
              setSuccessMessage(null);
              setIsOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light"
          >
            Annulla
          </button>
        </div>
      </form>
    </section>
  );
}
