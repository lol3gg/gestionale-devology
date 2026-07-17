"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Download, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractStoragePath } from "@/lib/storage/signedUrl";

const BUCKET = "preventivi-clienti";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 365 * 10; // 10 anni, come per gli allegati del form pubblico

export type PreventivoItem = {
  id: string;
  numero_preventivo: string;
  data_invio: string;
  nome_file: string;
  url_file: string;
  created_at: string;
  downloadUrl: string | null;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDataInvio(value: string) {
  return new Date(value).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

type PreventiviManagerProps = {
  richiestaId: string;
  preventiviIniziali: PreventivoItem[];
};

export function PreventiviManager({ richiestaId, preventiviIniziali }: PreventiviManagerProps) {
  const [preventivi, setPreventivi] = useState(preventiviIniziali);
  const [numero, setNumero] = useState("");
  const [dataInvio, setDataInvio] = useState(todayIsoDate());
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setErrorMessage(null);

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
    setNumero("");
    setDataInvio(todayIsoDate());
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!numero.trim()) {
      setErrorMessage("Inserisci il numero preventivo.");
      return;
    }
    if (!dataInvio) {
      setErrorMessage("Inserisci la data di invio.");
      return;
    }
    if (!file) {
      setErrorMessage("Seleziona il PDF del preventivo.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const storagePath = `${richiestaId}/${crypto.randomUUID()}-${file.name}`;

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

    const { data: inserted, error: insertError } = await supabase
      .from("preventivi")
      .insert({
        richiesta_id: richiestaId,
        numero_preventivo: numero.trim(),
        data_invio: dataInvio,
        nome_file: file.name,
        url_file: urlFile,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      setErrorMessage(insertError?.message ?? "Errore nel salvataggio del preventivo.");
      setIsUploading(false);
      return;
    }

    setPreventivi((current) =>
      [{ ...inserted, downloadUrl: urlFile } as PreventivoItem, ...current].sort((a, b) =>
        a.data_invio < b.data_invio ? 1 : -1
      )
    );
    resetForm();
    setIsUploading(false);
  }

  async function handleDelete(preventivo: PreventivoItem) {
    setDeletingId(preventivo.id);
    setErrorMessage(null);
    const supabase = createClient();

    const path = extractStoragePath(BUCKET, preventivo.url_file);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error: deleteError } = await supabase.from("preventivi").delete().eq("id", preventivo.id);

    if (deleteError) {
      setErrorMessage(`Errore nell'eliminazione: ${deleteError.message}`);
      setDeletingId(null);
      return;
    }

    setPreventivi((current) => current.filter((item) => item.id !== preventivo.id));
    setDeletingId(null);
  }

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
      <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text">
        <FileText className="h-4 w-4 text-brand-accent-light" />
        Preventivi collegati a questa richiesta
        {preventivi.length > 0 && (
          <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-semibold text-brand-muted ring-1 ring-inset ring-brand-border">
            {preventivi.length}
          </span>
        )}
      </h2>

      {preventivi.length === 0 ? (
        <p className="mt-2 text-sm text-brand-muted">Nessun preventivo caricato per questa richiesta.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {preventivi.map((preventivo) => (
            <li
              key={preventivo.id}
              className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-elevated text-brand-accent-light ring-1 ring-inset ring-brand-border">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-text">
                  {preventivo.numero_preventivo}
                </p>
                <p className="text-xs text-brand-muted">
                  Inviato il {formatDataInvio(preventivo.data_invio)}
                </p>
              </div>
              {preventivo.downloadUrl ? (
                <a
                  href={preventivo.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Scarica ${preventivo.numero_preventivo}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light"
                >
                  <Download className="h-4 w-4" />
                </a>
              ) : (
                <span className="shrink-0 text-xs text-brand-accent-light">N/D</span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(preventivo)}
                disabled={deletingId === preventivo.id}
                aria-label={`Elimina ${preventivo.numero_preventivo}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light disabled:opacity-50"
              >
                {deletingId === preventivo.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3 border-t border-brand-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Carica nuovo preventivo
        </p>

        {errorMessage && (
          <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-2.5 text-xs text-brand-accent-light">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="numero_preventivo" className="mb-1 block text-xs font-medium text-brand-soft">
              Numero preventivo
            </label>
            <input
              id="numero_preventivo"
              type="text"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              placeholder="Es. PRV-2026-014"
              className="w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <div>
            <label htmlFor="data_invio" className="mb-1 block text-xs font-medium text-brand-soft">
              Data invio
            </label>
            <input
              id="data_invio"
              type="date"
              value={dataInvio}
              onChange={(event) => setDataInvio(event.target.value)}
              className="w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="preventivo_file" className="mb-1 block text-xs font-medium text-brand-soft">
            File PDF (max 15MB)
          </label>
          <input
            ref={fileInputRef}
            id="preventivo_file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-surface file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-soft hover:file:bg-brand-border-strong"
          />
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
          {isUploading ? "Caricamento..." : "Carica preventivo"}
        </button>
      </form>
    </section>
  );
}
