"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent";

export function NuovoPreventivoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [azienda, setAzienda] = useState("");
  const [dataInvio, setDataInvio] = useState(todayIsoDate());
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
    router.refresh();
  }

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
      <h2 className="text-base font-semibold text-brand-text">Nuovo preventivo</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Crea un preventivo con nome, cognome, data e PDF. L&apos;azienda è opzionale.
      </p>

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
      </form>
    </section>
  );
}
