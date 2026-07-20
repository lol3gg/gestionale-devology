"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  FileQuestion,
  HelpCircle,
  Layers,
  Mail,
  MessageSquareQuote,
  Pencil,
  Phone,
  Wallet,
  X,
} from "lucide-react";
import {
  SAAS_SPIEGAZIONE,
  SPECIFICHE_TECNICHE_OPTIONS,
  TIPO_PROGETTO_OPTIONS,
} from "@/lib/richieste/progetto";
import {
  formatDataItaliana,
  formatEuro,
  getGiorniAllaScadenza,
  tempisticheToIsoDate,
} from "@/lib/richieste/format";
import { updateRichiestaDati, type TipoCliente } from "../actions";

export type RichiestaDatiIniziali = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  tipo_cliente: TipoCliente;
  nome_azienda: string | null;
  partita_iva: string | null;
  descrizione_progetto: string;
  tipo_progetto: string | null;
  specifiche_tecniche: string[] | null;
  budget: number | null;
  tempistiche: string | null;
  come_conosciuto: string | null;
  created_at: string;
};

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

const INPUT_BASE =
  "w-full rounded-md border bg-brand-surface px-3 py-3 text-base text-brand-text shadow-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";

function toFormState(dati: RichiestaDatiIniziali): FormState {
  const flessibile = (dati.tempistiche ?? "").trim().toLowerCase() === "flessibile";
  return {
    nome: dati.nome ?? "",
    cognome: dati.cognome ?? "",
    email: dati.email ?? "",
    telefono: dati.telefono ?? "",
    nomeAzienda: dati.nome_azienda ?? "",
    partitaIva: dati.partita_iva ?? "",
    descrizioneProgetto: dati.descrizione_progetto ?? "",
    tipoProgetto: dati.tipo_progetto ?? "",
    budget: dati.budget != null ? String(dati.budget) : "",
    tempistiche: flessibile ? "" : tempisticheToIsoDate(dati.tempistiche),
    comeConosciuto: dati.come_conosciuto ?? "",
  };
}

function DetailItem({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  warning?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-brand-text">{value}</dd>
        {warning && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-accent/15 px-2 py-0.5 text-[11px] font-semibold text-brand-accent-light ring-1 ring-inset ring-brand-accent/30">
            <AlertTriangle className="h-3 w-3" />
            {warning}
          </span>
        )}
      </div>
    </div>
  );
}

type ModificaRichiestaFormProps = {
  richiesta: RichiestaDatiIniziali;
};

export function ModificaRichiestaForm({ richiesta }: ModificaRichiestaFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [dati, setDati] = useState(richiesta);
  const [formData, setFormData] = useState(() => toFormState(richiesta));
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>(richiesta.tipo_cliente);
  const [scadenzaFlessibile, setScadenzaFlessibile] = useState(
    (richiesta.tempistiche ?? "").trim().toLowerCase() === "flessibile"
  );
  const [specificheTecniche, setSpecificheTecniche] = useState<string[]>(
    richiesta.specifiche_tecniche ?? []
  );
  const [showSaasInfo, setShowSaasInfo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  // Se il server revalida la pagina (es. dopo salvataggio), allinea lo stato locale.
  useEffect(() => {
    if (!isEditing) {
      setDati(richiesta);
      setFormData(toFormState(richiesta));
      setTipoCliente(richiesta.tipo_cliente);
      setScadenzaFlessibile((richiesta.tempistiche ?? "").trim().toLowerCase() === "flessibile");
      setSpecificheTecniche(richiesta.specifiche_tecniche ?? []);
    }
  }, [richiesta, isEditing]);

  const giorniAllaScadenza = getGiorniAllaScadenza(dati.tempistiche);
  let scadenzaWarning: string | undefined;
  if (giorniAllaScadenza !== null) {
    if (giorniAllaScadenza < 0) {
      scadenzaWarning = `Scadenza superata di ${Math.abs(giorniAllaScadenza)} giorni`;
    } else if (giorniAllaScadenza === 0) {
      scadenzaWarning = "Scade oggi";
    } else if (giorniAllaScadenza <= 14) {
      scadenzaWarning = `Scade in ${giorniAllaScadenza} giorni`;
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleTipoProgettoChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    setFormData((previous) => ({ ...previous, tipoProgetto: value }));
    setSpecificheTecniche([]);
    if (value !== "SaaS") setShowSaasInfo(false);
  }

  function toggleSpecificaTecnica(opzione: string) {
    setSpecificheTecniche((previous) =>
      previous.includes(opzione) ? previous.filter((item) => item !== opzione) : [...previous, opzione]
    );
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
      errors.budget = "Indica il budget indicativo.";
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

  function startEditing() {
    setFormData(toFormState(dati));
    setTipoCliente(dati.tipo_cliente);
    setScadenzaFlessibile((dati.tempistiche ?? "").trim().toLowerCase() === "flessibile");
    setSpecificheTecniche(dati.specifiche_tecniche ?? []);
    setShowSaasInfo(false);
    setFieldErrors({});
    setSaveError(null);
    setShowSaved(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setFormData(toFormState(dati));
    setTipoCliente(dati.tipo_cliente);
    setScadenzaFlessibile((dati.tempistiche ?? "").trim().toLowerCase() === "flessibile");
    setSpecificheTecniche(dati.specifiche_tecniche ?? []);
    setShowSaasInfo(false);
    setFieldErrors({});
    setSaveError(null);
    setIsEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        nome: formData.nome.trim(),
        cognome: formData.cognome.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim() || null,
        tipoCliente,
        nomeAzienda: tipoCliente === "azienda" ? formData.nomeAzienda.trim() : null,
        partitaIva:
          tipoCliente === "azienda" ? formData.partitaIva.trim() || null : null,
        descrizioneProgetto: formData.descrizioneProgetto.trim(),
        tipoProgetto: formData.tipoProgetto,
        specificheTecniche,
        budget: Number(formData.budget),
        tempistiche: scadenzaFlessibile ? "Flessibile" : formatDataItaliana(formData.tempistiche),
        comeConosciuto: formData.comeConosciuto.trim() || null,
      };

      await updateRichiestaDati(dati.id, payload);

      const aggiornati: RichiestaDatiIniziali = {
        ...dati,
        nome: payload.nome,
        cognome: payload.cognome,
        email: payload.email,
        telefono: payload.telefono,
        tipo_cliente: payload.tipoCliente,
        nome_azienda: payload.nomeAzienda,
        partita_iva: payload.partitaIva,
        descrizione_progetto: payload.descrizioneProgetto,
        tipo_progetto: payload.tipoProgetto,
        specifiche_tecniche: payload.specificheTecniche,
        budget: payload.budget,
        tempistiche: payload.tempistiche,
        come_conosciuto: payload.comeConosciuto,
      };

      setDati(aggiornati);
      setIsEditing(false);
      setShowSaved(true);
      router.refresh();
      window.setTimeout(() => setShowSaved(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Errore nel salvataggio.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-brand-text">Dettagli richiesta</h2>
          <div className="flex items-center gap-2">
            {showSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Dati aggiornati
              </span>
            )}
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifica dati
            </button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailItem icon={Mail} label="Email" value={dati.email} />
          <DetailItem icon={Phone} label="Telefono" value={dati.telefono ?? "—"} />
          <DetailItem
            icon={Building2}
            label="Tipo cliente"
            value={dati.tipo_cliente === "azienda" ? "Azienda" : "Privato"}
          />
          {dati.tipo_cliente === "azienda" && (
            <>
              <DetailItem icon={Building2} label="Nome azienda" value={dati.nome_azienda ?? "—"} />
              <DetailItem icon={FileQuestion} label="Partita IVA" value={dati.partita_iva ?? "—"} />
            </>
          )}
          <DetailItem icon={Layers} label="Tipo progetto" value={dati.tipo_progetto ?? "—"} />
          <DetailItem
            icon={Wallet}
            label="Budget indicativo"
            value={dati.budget != null ? formatEuro(dati.budget) : "—"}
          />
          <DetailItem
            icon={Calendar}
            label="Scadenza richiesta"
            value={dati.tempistiche ?? "—"}
            warning={scadenzaWarning}
          />
          <DetailItem
            icon={MessageSquareQuote}
            label="Come ci ha conosciuto"
            value={dati.come_conosciuto ?? "—"}
          />
          <DetailItem
            icon={Calendar}
            label="Data richiesta"
            value={new Date(dati.created_at).toLocaleString("it-IT")}
          />
        </dl>

        <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-soft">
            <MessageSquareQuote className="h-4 w-4 text-brand-accent-light" />
            Descrizione progetto
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
            {dati.descrizione_progetto}
          </p>
        </div>

        {dati.tipo_progetto && (
          <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-soft">
              <Layers className="h-4 w-4 text-brand-accent-light" />
              Specifiche tecniche
            </h3>
            {dati.specifiche_tecniche && dati.specifiche_tecniche.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {dati.specifiche_tecniche.map((specifica) => (
                  <li
                    key={specifica}
                    className="rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent-light ring-1 ring-inset ring-brand-accent/25"
                  >
                    {specifica}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-brand-muted">Nessuna specifica indicata.</p>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-brand-text">Modifica dati richiesta</h2>
        <button
          type="button"
          onClick={cancelEditing}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Annulla
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome" className="mb-1 block text-sm font-medium text-brand-soft">
              Nome *
            </label>
            <input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              className={`${INPUT_BASE} ${fieldErrors.nome ? "border-brand-accent" : "border-brand-border-strong"}`}
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.nome}</p>
            )}
          </div>
          <div>
            <label htmlFor="cognome" className="mb-1 block text-sm font-medium text-brand-soft">
              Cognome *
            </label>
            <input
              id="cognome"
              name="cognome"
              value={formData.cognome}
              onChange={handleInputChange}
              className={`${INPUT_BASE} ${fieldErrors.cognome ? "border-brand-accent" : "border-brand-border-strong"}`}
            />
            {fieldErrors.cognome && (
              <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.cognome}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-soft">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`${INPUT_BASE} ${fieldErrors.email ? "border-brand-accent" : "border-brand-border-strong"}`}
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
              value={formData.telefono}
              onChange={handleInputChange}
              className={`${INPUT_BASE} border-brand-border-strong`}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-soft">Tipo cliente *</p>
          <div className="flex gap-3">
            {(["privato", "azienda"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoCliente(tipo)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  tipoCliente === tipo
                    ? "bg-brand-accent/20 text-brand-accent-light ring-1 ring-inset ring-brand-accent/40"
                    : "bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border hover:text-brand-soft"
                }`}
              >
                {tipo === "azienda" ? "Azienda" : "Privato"}
              </button>
            ))}
          </div>
        </div>

        {tipoCliente === "azienda" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nomeAzienda" className="mb-1 block text-sm font-medium text-brand-soft">
                Nome azienda *
              </label>
              <input
                id="nomeAzienda"
                name="nomeAzienda"
                value={formData.nomeAzienda}
                onChange={handleInputChange}
                className={`${INPUT_BASE} ${fieldErrors.nomeAzienda ? "border-brand-accent" : "border-brand-border-strong"}`}
              />
              {fieldErrors.nomeAzienda && (
                <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.nomeAzienda}</p>
              )}
            </div>
            <div>
              <label htmlFor="partitaIva" className="mb-1 block text-sm font-medium text-brand-soft">
                Partita IVA (opzionale)
              </label>
              <input
                id="partitaIva"
                name="partitaIva"
                value={formData.partitaIva}
                onChange={handleInputChange}
                className={`${INPUT_BASE} border-brand-border-strong`}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="descrizioneProgetto" className="mb-1 block text-sm font-medium text-brand-soft">
            Descrizione progetto *
          </label>
          <textarea
            id="descrizioneProgetto"
            name="descrizioneProgetto"
            rows={5}
            value={formData.descrizioneProgetto}
            onChange={handleInputChange}
            className={`${INPUT_BASE} resize-y ${fieldErrors.descrizioneProgetto ? "border-brand-accent" : "border-brand-border-strong"}`}
          />
          {fieldErrors.descrizioneProgetto && (
            <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.descrizioneProgetto}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label htmlFor="tipoProgetto" className="block text-sm font-medium text-brand-soft">
                Tipo di progetto *
              </label>
              {formData.tipoProgetto === "SaaS" && (
                <button
                  type="button"
                  onClick={() => setShowSaasInfo((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent-light hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Cos&apos;è?
                </button>
              )}
            </div>
            <select
              id="tipoProgetto"
              name="tipoProgetto"
              value={formData.tipoProgetto}
              onChange={handleTipoProgettoChange}
              className={`${INPUT_BASE} ${fieldErrors.tipoProgetto ? "border-brand-accent" : "border-brand-border-strong"}`}
            >
              <option value="">Seleziona...</option>
              {TIPO_PROGETTO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.tipoProgetto && (
              <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.tipoProgetto}</p>
            )}
            {showSaasInfo && (
              <p className="mt-2 rounded-lg border border-brand-border bg-brand-surface p-3 text-xs leading-relaxed text-brand-muted">
                {SAAS_SPIEGAZIONE}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="budget" className="mb-1 block text-sm font-medium text-brand-soft">
              Budget indicativo (€) *
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min={0}
              step={50}
              value={formData.budget}
              onChange={handleInputChange}
              className={`${INPUT_BASE} ${fieldErrors.budget ? "border-brand-accent" : "border-brand-border-strong"}`}
            />
            {fieldErrors.budget && (
              <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.budget}</p>
            )}
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            formData.tipoProgetto &&
            (SPECIFICHE_TECNICHE_OPTIONS[formData.tipoProgetto]?.length ?? 0) > 0
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            {formData.tipoProgetto &&
              (SPECIFICHE_TECNICHE_OPTIONS[formData.tipoProgetto]?.length ?? 0) > 0 && (
                <fieldset className="rounded-xl border border-brand-border bg-brand-surface p-4">
                  <legend className="px-1 text-sm font-medium text-brand-soft">
                    Specifiche tecniche
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(SPECIFICHE_TECNICHE_OPTIONS[formData.tipoProgetto] ?? []).map((opzione) => (
                      <label
                        key={opzione}
                        className="flex cursor-pointer items-start gap-2 text-sm text-brand-muted"
                      >
                        <input
                          type="checkbox"
                          checked={specificheTecniche.includes(opzione)}
                          onChange={() => toggleSpecificaTecnica(opzione)}
                          className="mt-0.5 rounded border-brand-border-strong text-brand-accent focus:ring-brand-accent"
                        />
                        <span>{opzione}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tempistiche" className="mb-1 block text-sm font-medium text-brand-soft">
              Scadenza richiesta *
            </label>
            <input
              id="tempistiche"
              name="tempistiche"
              type="date"
              disabled={scadenzaFlessibile}
              value={scadenzaFlessibile ? "" : formData.tempistiche}
              onChange={handleInputChange}
              className={`${INPUT_BASE} disabled:cursor-not-allowed disabled:opacity-50 ${
                fieldErrors.tempistiche ? "border-brand-accent" : "border-brand-border-strong"
              }`}
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-brand-muted">
              <input
                type="checkbox"
                checked={scadenzaFlessibile}
                onChange={(event) => {
                  setScadenzaFlessibile(event.target.checked);
                  if (event.target.checked) {
                    setFormData((previous) => ({ ...previous, tempistiche: "" }));
                  }
                }}
                className="rounded border-brand-border-strong text-brand-accent focus:ring-brand-accent"
              />
              Non ho una scadenza precisa, sono flessibile
            </label>
            {fieldErrors.tempistiche && (
              <p className="mt-1 text-xs text-brand-accent-light">{fieldErrors.tempistiche}</p>
            )}
          </div>

          <div>
            <label htmlFor="comeConosciuto" className="mb-1 block text-sm font-medium text-brand-soft">
              Come ci ha conosciuto
            </label>
            <input
              id="comeConosciuto"
              name="comeConosciuto"
              value={formData.comeConosciuto}
              onChange={handleInputChange}
              className={`${INPUT_BASE} border-brand-border-strong`}
            />
          </div>
        </div>

        {saveError && (
          <p className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent-light">
            {saveError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-brand-border pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {isSaving ? "Salvataggio..." : "Salva modifiche"}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light disabled:opacity-60"
          >
            Annulla
          </button>
        </div>
      </form>
    </section>
  );
}
