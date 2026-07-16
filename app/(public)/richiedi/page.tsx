"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Schema Supabase di riferimento (vedi supabase/schema.sql):
 * - tabella "richieste": nome, cognome, email, telefono, tipo_cliente,
 *   nome_azienda, partita_iva, descrizione_progetto, budget, tempistiche,
 *   come_conosciuto.
 * - bucket storage privato "allegati-clienti": file salvati in "<richiesta_id>/<file>".
 * - tabella "allegati": richiesta_id, nome_file, url_file (signed URL, il bucket
 *   è privato quindi non esiste un url pubblico diretto).
 */

type TipoCliente = "privato" | "azienda";

type FormState = {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  nomeAzienda: string;
  partitaIva: string;
  descrizioneProgetto: string;
  budget: string;
  tempistiche: string;
  comeConosciuto: string;
};

const INITIAL_FORM_STATE: FormState = {
  nome: "",
  cognome: "",
  email: "",
  telefono: "",
  nomeAzienda: "",
  partitaIva: "",
  descrizioneProgetto: "",
  budget: "",
  tempistiche: "",
  comeConosciuto: "",
};

const BUDGET_OPTIONS = [
  "Meno di 1.000€",
  "1.000-5.000€",
  "5.000-15.000€",
  "Oltre 15.000€",
  "Da definire",
];

const TEMPISTICHE_OPTIONS = ["Urgente", "Entro 1 mese", "Entro 3 mesi", "Flessibile"];

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".docx"];
// La tabella "allegati" salva solo il signed URL (nessuna colonna con il percorso
// storage), quindi non può essere rigenerato in seguito: usiamo una scadenza lunga.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 365 * 10; // 10 anni

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedFile(file: File) {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  return ACCEPTED_MIME_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
}

export default function RichiediPage() {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("privato");
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of selected) {
      if (!isAcceptedFile(file)) {
        errors.push(`"${file.name}" non è un formato accettato (PDF, PNG, JPG, DOCX).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" supera i 10MB consentiti.`);
        continue;
      }
      valid.push(file);
    }

    setFiles((previous) => {
      const combined = [...previous, ...valid];
      const deduplicated = combined.filter(
        (file, index) =>
          combined.findIndex((f) => f.name === file.name && f.size === file.size) === index
      );

      if (deduplicated.length > MAX_FILES) {
        errors.push(`Puoi caricare al massimo ${MAX_FILES} file.`);
        return deduplicated.slice(0, MAX_FILES);
      }

      return deduplicated;
    });

    setFileError(errors.length > 0 ? errors.join(" ") : null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(fileToRemove: File) {
    setFiles((previous) => previous.filter((file) => file !== fileToRemove));
    setFileError(null);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!formData.nome.trim()) errors.nome = "Il nome è obbligatorio.";
    if (!formData.cognome.trim()) errors.cognome = "Il cognome è obbligatorio.";
    if (!formData.email.trim()) {
      errors.email = "L'email è obbligatoria.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Inserisci un'email valida.";
    }
    if (tipoCliente === "azienda" && !formData.nomeAzienda.trim()) {
      errors.nomeAzienda = "Il nome azienda è obbligatorio per i clienti aziendali.";
    }
    if (!formData.descrizioneProgetto.trim()) {
      errors.descrizioneProgetto = "La descrizione del progetto è obbligatoria.";
    }
    if (!formData.budget) errors.budget = "Seleziona un budget indicativo.";
    if (!formData.tempistiche) errors.tempistiche = "Seleziona le tempistiche desiderate.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    setFormData(INITIAL_FORM_STATE);
    setTipoCliente("privato");
    setFiles([]);
    setFieldErrors({});
    setFileError(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const isValid = validate();
    if (!isValid) return;

    setStatus("submitting");

    try {
      const supabase = createClient();

      // L'id viene generato lato client (invece di leggerlo da un .select()
      // dopo l'insert) perché il ruolo "anon" può SOLO scrivere su "richieste",
      // non leggere: una RETURNING/.select() dopo l'insert verrebbe bloccata
      // dalla row level security, dato che manca (di proposito, per privacy)
      // una policy SELECT per gli utenti anonimi.
      const richiestaId = crypto.randomUUID();

      const { error: richiestaError } = await supabase.from("richieste").insert({
        id: richiestaId,
        nome: formData.nome.trim(),
        cognome: formData.cognome.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim() || null,
        tipo_cliente: tipoCliente,
        nome_azienda: tipoCliente === "azienda" ? formData.nomeAzienda.trim() : null,
        partita_iva: tipoCliente === "azienda" ? formData.partitaIva.trim() || null : null,
        descrizione_progetto: formData.descrizioneProgetto.trim(),
        budget: formData.budget,
        tempistiche: formData.tempistiche,
        come_conosciuto: formData.comeConosciuto.trim() || null,
      });

      if (richiestaError) {
        throw new Error(richiestaError.message ?? "Impossibile salvare la richiesta.");
      }

      for (const file of files) {
        const percorso = `${richiestaId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("allegati-clienti")
          .upload(percorso, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw new Error(`Errore nel caricamento di "${file.name}": ${uploadError.message}`);
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("allegati-clienti")
          .createSignedUrl(percorso, SIGNED_URL_EXPIRY_SECONDS);

        if (signedUrlError || !signedUrlData) {
          throw new Error(
            `Errore nella generazione dell'url per "${file.name}": ${signedUrlError?.message ?? ""}`
          );
        }

        const { error: allegatoError } = await supabase.from("allegati").insert({
          richiesta_id: richiestaId,
          nome_file: file.name,
          url_file: signedUrlData.signedUrl,
        });

        if (allegatoError) {
          throw new Error(`Errore nel salvataggio dell'allegato "${file.name}": ${allegatoError.message}`);
        }
      }

      setStatus("success");
      resetForm();
    } catch (error) {
      setStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Si è verificato un errore imprevisto.");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Richiedi un preventivo</h1>
          <p className="mt-2 text-sm text-gray-500">
            Raccontaci il tuo progetto: ti risponderemo il prima possibile.
          </p>
        </div>

        {status === "success" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Richiesta inviata con successo
          </div>
        )}

        {status === "error" && submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {submitError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Dati personali */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Dati personali</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nome" className="mb-1 block text-sm font-medium text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.nome ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErrors.nome && <p className="mt-1 text-xs text-red-600">{fieldErrors.nome}</p>}
              </div>

              <div>
                <label htmlFor="cognome" className="mb-1 block text-sm font-medium text-gray-700">
                  Cognome <span className="text-red-500">*</span>
                </label>
                <input
                  id="cognome"
                  name="cognome"
                  type="text"
                  required
                  value={formData.cognome}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.cognome ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErrors.cognome && <p className="mt-1 text-xs text-red-600">{fieldErrors.cognome}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.email ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-gray-700">
                  Telefono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Tipo cliente */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Tipo cliente</h2>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="tipoCliente"
                  value="privato"
                  checked={tipoCliente === "privato"}
                  onChange={() => setTipoCliente("privato")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                Privato
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="tipoCliente"
                  value="azienda"
                  checked={tipoCliente === "azienda"}
                  onChange={() => setTipoCliente("azienda")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                Azienda
              </label>
            </div>

            {tipoCliente === "azienda" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nomeAzienda" className="mb-1 block text-sm font-medium text-gray-700">
                    Nome azienda <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nomeAzienda"
                    name="nomeAzienda"
                    type="text"
                    required
                    value={formData.nomeAzienda}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.nomeAzienda ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {fieldErrors.nomeAzienda && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.nomeAzienda}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="partitaIva" className="mb-1 block text-sm font-medium text-gray-700">
                    Partita IVA
                  </label>
                  <input
                    id="partitaIva"
                    name="partitaIva"
                    type="text"
                    value={formData.partitaIva}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Progetto */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Il tuo progetto</h2>

            <div>
              <label htmlFor="descrizioneProgetto" className="mb-1 block text-sm font-medium text-gray-700">
                Descrizione progetto <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descrizioneProgetto"
                name="descrizioneProgetto"
                required
                rows={7}
                placeholder="Descrivi il tuo progetto nel modo più specifico possibile: obiettivi, funzionalità desiderate, riferimenti, vincoli tecnici..."
                value={formData.descrizioneProgetto}
                onChange={handleInputChange}
                className={`w-full resize-y rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.descrizioneProgetto ? "border-red-400" : "border-gray-300"
                }`}
              />
              {fieldErrors.descrizioneProgetto && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.descrizioneProgetto}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="budget" className="mb-1 block text-sm font-medium text-gray-700">
                  Budget indicativo <span className="text-red-500">*</span>
                </label>
                <select
                  id="budget"
                  name="budget"
                  required
                  value={formData.budget}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.budget ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <option value="" disabled>
                    -- Seleziona --
                  </option>
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {fieldErrors.budget && <p className="mt-1 text-xs text-red-600">{fieldErrors.budget}</p>}
              </div>

              <div>
                <label htmlFor="tempistiche" className="mb-1 block text-sm font-medium text-gray-700">
                  Tempistiche desiderate <span className="text-red-500">*</span>
                </label>
                <select
                  id="tempistiche"
                  name="tempistiche"
                  required
                  value={formData.tempistiche}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.tempistiche ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <option value="" disabled>
                    -- Seleziona --
                  </option>
                  {TEMPISTICHE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {fieldErrors.tempistiche && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.tempistiche}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="comeConosciuto" className="mb-1 block text-sm font-medium text-gray-700">
                Come ci hai conosciuto?
              </label>
              <input
                id="comeConosciuto"
                name="comeConosciuto"
                type="text"
                value={formData.comeConosciuto}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Allegati */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Allegati</h2>
            <p className="text-xs text-gray-500">
              Formati accettati: PDF, PNG, JPG, DOCX. Max 10MB a file, massimo {MAX_FILES} file.
            </p>

            <label
              htmlFor="allegati"
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50"
            >
              <span className="font-medium text-blue-600">Scegli i file</span>
              <span className="mt-1 text-xs text-gray-400">oppure trascinali qui</span>
              <input
                id="allegati"
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {fileError && <p className="text-xs text-red-600">{fileError}</p>}

            {files.length > 0 && (
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                {files.map((file) => (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-gray-700">{file.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Rimuovi
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Invio in corso..." : "Invia richiesta"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
