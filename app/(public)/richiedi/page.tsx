"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Schema Supabase di riferimento (vedi supabase/schema.sql):
 * - tabella "richieste": nome, cognome, email, telefono, tipo_cliente,
 *   nome_azienda, partita_iva, descrizione_progetto, budget (numeric),
 *   tempistiche (text: data leggibile "gg/mm/aaaa" oppure "Flessibile"),
 *   tipo_progetto (text), specifiche_tecniche (text[]), come_conosciuto.
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
  tipoProgetto: string;
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
  tipoProgetto: "",
  budget: "",
  tempistiche: "",
  comeConosciuto: "",
};

const TIPO_PROGETTO_OPTIONS = [
  "App mobile",
  "Web App",
  "SaaS",
  "Gestionale",
  "Automazione con AI",
  "Altro",
] as const;

/** Specifiche tecniche selezionabili (checkbox multiple, opzionali) per ciascun tipo di progetto. */
const SPECIFICHE_TECNICHE_OPTIONS: Record<string, string[]> = {
  "App mobile": [
    "iOS",
    "Android",
    "Multipiattaforma (iOS + Android)",
    "Pagamenti in-app",
    "Notifiche push",
    "Sistema di login/account utente",
    "Multiutente (più persone usano lo stesso account/dati condivisi)",
    "Integrazione con servizi esterni (es. Google, social login, API di terzi)",
  ],
  "Web App": [
    "Sistema di login/account utente",
    "Multiutente con permessi diversi",
    "Pagamenti online",
    "Area riservata privata",
    "Integrazione con servizi esterni/API",
    "Dashboard con statistiche/report",
  ],
  SaaS: [
    "Abbonamenti/pagamenti ricorrenti",
    "Multi-tenant (più aziende/clienti separati usano lo stesso sistema con dati isolati tra loro)",
    "Pannello di amministrazione",
    "Livelli di accesso/ruoli utente differenti",
    "Integrazione con servizi esterni/API",
  ],
  Gestionale: [
    "Gestione magazzino/inventario",
    "Gestione clienti (CRM)",
    "Fatturazione/documenti",
    "Multiutente con permessi differenti",
    "Reportistica e statistiche",
  ],
  "Automazione con AI": [
    "Automazione di processi interni ripetitivi",
    "Chatbot/assistente virtuale",
    "Analisi automatica di dati",
    "Integrazione con altri software già in uso (es. CRM, email, gestionali)",
  ],
  Altro: [],
};

const SAAS_SPIEGAZIONE =
  "Un SaaS (Software as a Service) è un software accessibile online in abbonamento, spesso usato da più aziende o utenti diversi contemporaneamente (es. Netflix per il software: paghi un abbonamento e usi il servizio da browser, senza installare nulla).";

/** Converte una data ISO ("2026-08-20", da input type="date") in formato leggibile "20/08/2026". */
function formatDataItaliana(isoDate: string) {
  const [anno, mese, giorno] = isoDate.split("-");
  return `${giorno}/${mese}/${anno}`;
}

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

const INPUT_BASE =
  "w-full rounded-md border bg-brand-surface px-3 py-2 text-sm text-brand-text shadow-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent";

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
  const [scadenzaFlessibile, setScadenzaFlessibile] = useState(false);
  const [specificheTecniche, setSpecificheTecniche] = useState<string[]>([]);
  const [showSaasInfo, setShowSaasInfo] = useState(false);
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

  function handleTipoProgettoChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    setFormData((previous) => ({ ...previous, tipoProgetto: value }));
    // Le specifiche selezionate appartengono al tipo di progetto precedente: non hanno più senso.
    setSpecificheTecniche([]);
    if (value !== "SaaS") setShowSaasInfo(false);
  }

  function toggleSpecificaTecnica(opzione: string) {
    setSpecificheTecniche((previous) =>
      previous.includes(opzione) ? previous.filter((item) => item !== opzione) : [...previous, opzione]
    );
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
    if (!formData.tipoProgetto) {
      errors.tipoProgetto = "Seleziona il tipo di progetto.";
    }
    if (!formData.budget.trim()) {
      errors.budget = "Indica il tuo budget indicativo.";
    } else {
      const budgetNumerico = Number(formData.budget);
      if (Number.isNaN(budgetNumerico) || budgetNumerico <= 0) {
        errors.budget = "Inserisci un budget valido (un numero maggiore di zero).";
      }
    }

    if (!scadenzaFlessibile && !formData.tempistiche) {
      errors.tempistiche = "Indica una data di scadenza oppure seleziona 'sono flessibile'.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    setFormData(INITIAL_FORM_STATE);
    setTipoCliente("privato");
    setScadenzaFlessibile(false);
    setSpecificheTecniche([]);
    setShowSaasInfo(false);
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
        tipo_progetto: formData.tipoProgetto,
        specifiche_tecniche: specificheTecniche,
        budget: Number(formData.budget),
        tempistiche: scadenzaFlessibile ? "Flessibile" : formatDataItaliana(formData.tempistiche),
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
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(211,17,43,0.14),transparent_55%)]" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Image
            src="/logo/devology-logo-full.svg"
            alt="Devology System"
            width={200}
            height={125}
            priority
            className="mx-auto h-16 w-auto"
          />
          <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] text-brand-text">
            Richiedi un preventivo
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Raccontaci il tuo progetto: ti risponderemo il prima possibile.
          </p>
        </div>

        {status === "success" && (
          <div className="mb-6 rounded-md border border-emerald-800/50 bg-emerald-950/40 p-4 text-sm text-emerald-300">
            Richiesta inviata con successo
          </div>
        )}

        {status === "error" && submitError && (
          <div className="mb-6 rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
            {submitError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-8 rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md sm:p-8"
        >
          {/* Dati personali */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-brand-text">Dati personali</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nome" className="mb-1 block text-sm font-medium text-brand-soft">
                  Nome <span className="text-brand-accent-light">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`${INPUT_BASE} ${
                    fieldErrors.nome ? "border-brand-accent" : "border-brand-border-strong"
                  }`}
                />
                {fieldErrors.nome && (
                  <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.nome}</p>
                )}
              </div>

              <div>
                <label htmlFor="cognome" className="mb-1 block text-sm font-medium text-brand-soft">
                  Cognome <span className="text-brand-accent-light">*</span>
                </label>
                <input
                  id="cognome"
                  name="cognome"
                  type="text"
                  required
                  value={formData.cognome}
                  onChange={handleInputChange}
                  className={`${INPUT_BASE} ${
                    fieldErrors.cognome ? "border-brand-accent" : "border-brand-border-strong"
                  }`}
                />
                {fieldErrors.cognome && (
                  <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.cognome}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-soft">
                  Email <span className="text-brand-accent-light">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`${INPUT_BASE} ${
                    fieldErrors.email ? "border-brand-accent" : "border-brand-border-strong"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-brand-soft">
                  Telefono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={`${INPUT_BASE} border-brand-border-strong`}
                />
              </div>
            </div>
          </section>

          {/* Tipo cliente */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-brand-text">Tipo cliente</h2>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-brand-soft">
                <input
                  type="radio"
                  name="tipoCliente"
                  value="privato"
                  checked={tipoCliente === "privato"}
                  onChange={() => setTipoCliente("privato")}
                  className="h-4 w-4 border-brand-border-strong text-brand-accent focus:ring-brand-accent"
                />
                Privato
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-soft">
                <input
                  type="radio"
                  name="tipoCliente"
                  value="azienda"
                  checked={tipoCliente === "azienda"}
                  onChange={() => setTipoCliente("azienda")}
                  className="h-4 w-4 border-brand-border-strong text-brand-accent focus:ring-brand-accent"
                />
                Azienda
              </label>
            </div>

            {tipoCliente === "azienda" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nomeAzienda" className="mb-1 block text-sm font-medium text-brand-soft">
                    Nome azienda <span className="text-brand-accent-light">*</span>
                  </label>
                  <input
                    id="nomeAzienda"
                    name="nomeAzienda"
                    type="text"
                    required
                    value={formData.nomeAzienda}
                    onChange={handleInputChange}
                    className={`${INPUT_BASE} ${
                      fieldErrors.nomeAzienda ? "border-brand-accent" : "border-brand-border-strong"
                    }`}
                  />
                  {fieldErrors.nomeAzienda && (
                    <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.nomeAzienda}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="partitaIva" className="mb-1 block text-sm font-medium text-brand-soft">
                    Partita IVA <span className="text-brand-muted">(opzionale)</span>
                  </label>
                  <input
                    id="partitaIva"
                    name="partitaIva"
                    type="text"
                    value={formData.partitaIva}
                    onChange={handleInputChange}
                    className={`${INPUT_BASE} border-brand-border-strong`}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Progetto */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-brand-text">Il tuo progetto</h2>

            <div>
              <label
                htmlFor="descrizioneProgetto"
                className="mb-1 block text-sm font-medium text-brand-soft"
              >
                Descrizione progetto <span className="text-brand-accent-light">*</span>
              </label>
              <textarea
                id="descrizioneProgetto"
                name="descrizioneProgetto"
                required
                rows={7}
                placeholder="Descrivi il tuo progetto nel modo più specifico possibile: obiettivi, funzionalità desiderate, riferimenti, vincoli tecnici..."
                value={formData.descrizioneProgetto}
                onChange={handleInputChange}
                className={`${INPUT_BASE} resize-y ${
                  fieldErrors.descrizioneProgetto ? "border-brand-accent" : "border-brand-border-strong"
                }`}
              />
              {fieldErrors.descrizioneProgetto && (
                <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.descrizioneProgetto}</p>
              )}
            </div>

            <div>
              <label htmlFor="tipoProgetto" className="mb-1 block text-sm font-medium text-brand-soft">
                Che tipo di progetto vuoi realizzare? <span className="text-brand-accent-light">*</span>
              </label>
              <select
                id="tipoProgetto"
                name="tipoProgetto"
                required
                value={formData.tipoProgetto}
                onChange={handleTipoProgettoChange}
                className={`${INPUT_BASE} ${
                  fieldErrors.tipoProgetto ? "border-brand-accent" : "border-brand-border-strong"
                }`}
              >
                <option value="" disabled>
                  -- Seleziona --
                </option>
                {TIPO_PROGETTO_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.tipoProgetto && (
                <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.tipoProgetto}</p>
              )}

              <button
                type="button"
                onClick={() => setShowSaasInfo((current) => !current)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-accent-light transition hover:text-brand-accent"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Cos&apos;è un SaaS?
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  showSaasInfo ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="rounded-md border border-brand-border bg-brand-surface p-3 text-xs leading-relaxed text-brand-muted">
                    {SAAS_SPIEGAZIONE}
                  </p>
                </div>
              </div>

              {/* Specifiche tecniche: condizionali in base al tipo di progetto, opzionali. */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  formData.tipoProgetto && SPECIFICHE_TECNICHE_OPTIONS[formData.tipoProgetto]?.length > 0
                    ? "mt-4 grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                    <p className="text-sm font-medium text-brand-soft">Specifiche tecniche (opzionale)</p>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      Seleziona tutte le funzionalità che ti interessano per questo progetto.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {(SPECIFICHE_TECNICHE_OPTIONS[formData.tipoProgetto] ?? []).map((opzione) => (
                        <label key={opzione} className="flex items-start gap-2 text-sm text-brand-soft">
                          <input
                            type="checkbox"
                            checked={specificheTecniche.includes(opzione)}
                            onChange={() => toggleSpecificaTecnica(opzione)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-border-strong text-brand-accent focus:ring-brand-accent"
                          />
                          <span>{opzione}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="budget" className="mb-1 block text-sm font-medium text-brand-soft">
                  Qual è il tuo budget indicativo per questo progetto? (€){" "}
                  <span className="text-brand-accent-light">*</span>
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min={0}
                  step={50}
                  required
                  placeholder="Es. 3500"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className={`${INPUT_BASE} ${
                    fieldErrors.budget ? "border-brand-accent" : "border-brand-border-strong"
                  }`}
                />
                {fieldErrors.budget && (
                  <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.budget}</p>
                )}
                <p className="mt-1.5 text-xs text-brand-muted">
                  Indica una cifra il più precisa possibile. Questo ci permette di dirti subito se il
                  progetto che hai in mente è realizzabile con quel budget, evitando di farti perdere
                  tempo con un preventivo che poi risulta troppo alto rispetto alle tue disponibilità.
                </p>
              </div>

              <div>
                <label htmlFor="tempistiche" className="mb-1 block text-sm font-medium text-brand-soft">
                  Entro quale data ti servirebbe il progetto completato?{" "}
                  <span className="text-brand-accent-light">*</span>
                </label>

                <label className="mb-2 flex items-center gap-2 text-xs text-brand-soft">
                  <input
                    type="checkbox"
                    checked={scadenzaFlessibile}
                    onChange={(event) => setScadenzaFlessibile(event.target.checked)}
                    className="h-4 w-4 rounded border-brand-border-strong text-brand-accent focus:ring-brand-accent"
                  />
                  Non ho una scadenza precisa, sono flessibile
                </label>

                <input
                  id="tempistiche"
                  name="tempistiche"
                  type="date"
                  required={!scadenzaFlessibile}
                  disabled={scadenzaFlessibile}
                  value={formData.tempistiche}
                  onChange={handleInputChange}
                  className={`${INPUT_BASE} ${
                    fieldErrors.tempistiche ? "border-brand-accent" : "border-brand-border-strong"
                  } ${scadenzaFlessibile ? "cursor-not-allowed opacity-50" : ""}`}
                />
                {fieldErrors.tempistiche && (
                  <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.tempistiche}</p>
                )}
                <p className="mt-1.5 text-xs text-brand-muted">
                  Questa data ci serve per valutare se riusciamo a garantirti il completamento del
                  lavoro entro i tempi che ti servono, tenendo conto degli altri progetti in corso.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="comeConosciuto" className="mb-1 block text-sm font-medium text-brand-soft">
                Come ci hai conosciuto?
              </label>
              <input
                id="comeConosciuto"
                name="comeConosciuto"
                type="text"
                value={formData.comeConosciuto}
                onChange={handleInputChange}
                className={`${INPUT_BASE} border-brand-border-strong`}
              />
            </div>
          </section>

          {/* Allegati */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-brand-text">Allegati</h2>
            <p className="text-xs text-brand-muted">
              Formati accettati: PDF, PNG, JPG, DOCX. Max 10MB a file, massimo {MAX_FILES} file.
            </p>

            <label
              htmlFor="allegati"
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-brand-border-strong bg-brand-surface px-4 py-6 text-center text-sm text-brand-muted transition hover:border-brand-accent/50 hover:bg-brand-accent/5"
            >
              <span className="font-medium text-brand-accent-light">Scegli i file</span>
              <span className="mt-1 text-xs text-brand-muted">oppure trascinali qui</span>
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

            {fileError && <p className="text-xs text-brand-accent-light">{fileError}</p>}

            {files.length > 0 && (
              <ul className="divide-y divide-brand-border rounded-md border border-brand-border">
                {files.map((file) => (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-brand-soft">{file.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-brand-muted">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="text-xs font-medium text-brand-accent-light hover:text-brand-accent"
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
              className="w-full rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-3 text-sm font-semibold text-white shadow-brand-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Invio in corso..." : "Invia richiesta"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
