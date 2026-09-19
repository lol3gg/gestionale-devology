"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Percent,
  Phone,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { formatDataBreve, formatEuro } from "@/lib/contabilita/format";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";
import { getStatoPreventivoLabel } from "@/lib/preventivi/stato";
import {
  importoDovuto,
  isPreventivoChiuso,
  labelPreventivo,
  residuoLavoro,
  riepilogoCollaboratore,
} from "@/lib/collaboratori/calcoli";
import { getTipoCollaboratoreLabel } from "@/lib/collaboratori/types";
import type { Collaboratore, CollaboratoreLavoro, PreventivoOption } from "@/lib/collaboratori/types";
import {
  createLavoro,
  deleteCollaboratore,
  deleteLavoro,
  pagaResiduoLavoro,
  pagaTuttoCollaboratore,
  registraPagamento,
  updateCollaboratore,
  updateLavoroPercentuale,
} from "../actions";
import { CopiaLinkPortaleButton } from "./CopiaLinkPortaleButton";

const INPUT =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent";
const LABEL = "mb-1 block text-xs font-medium text-brand-soft";

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === "azienda") return <Building2 className="h-3.5 w-3.5" />;
  if (tipo === "freelancer") return <User className="h-3.5 w-3.5" />;
  return <Users className="h-3.5 w-3.5" />;
}

function clienteLavoro(lavoro: CollaboratoreLavoro) {
  if (lavoro.preventivo) return labelPreventivo(lavoro.preventivo);
  return lavoro.cliente?.trim() || lavoro.descrizione?.trim() || "Lavoro";
}

export function CollaboratoriLista({
  collaboratori,
  preventivi,
}: {
  collaboratori: Collaboratore[];
  preventivi: PreventivoOption[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (collaboratori.length === 0) {
      setExpandedId(null);
      return;
    }
    setExpandedId((current) =>
      current && collaboratori.some((item) => item.id === current) ? current : collaboratori[0].id
    );
  }, [collaboratori]);

  if (collaboratori.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-brand-lg border border-brand-border bg-brand-elevated px-4 py-16 text-center shadow-brand-md">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
          <Users className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-brand-soft">Nessun collaboratore.</p>
        <p className="text-xs text-brand-muted">
          Aggiungi un’azienda, un freelancer o una persona e poi collega i preventivi chiusi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {collaboratori.map((collaboratore) => (
        <CollaboratoreCard
          key={collaboratore.id}
          collaboratore={collaboratore}
          preventivi={preventivi}
          expanded={expandedId === collaboratore.id}
          onToggle={() =>
            setExpandedId((current) => (current === collaboratore.id ? null : collaboratore.id))
          }
        />
      ))}
    </div>
  );
}

function CollaboratoreCard({
  collaboratore,
  preventivi,
  expanded,
  onToggle,
}: {
  collaboratore: Collaboratore;
  preventivi: PreventivoOption[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [percentuale, setPercentuale] = useState(String(collaboratore.percentuale));
  const stats = riepilogoCollaboratore(collaboratore);
  const initials = getInitials(collaboratore.nome);

  function run(action: () => Promise<void>) {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Operazione non riuscita.");
      }
    });
  }

  function handlePercentualeBlur() {
    const value = Number(percentuale.replace(",", "."));
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setPercentuale(String(collaboratore.percentuale));
      return;
    }
    if (value === Number(collaboratore.percentuale)) return;
    run(() => updateCollaboratore(collaboratore.id, { percentuale: value }));
  }

  function handleDelete() {
    if (!window.confirm(`Eliminare ${collaboratore.nome} e tutti i lavori collegati?`)) return;
    run(() => deleteCollaboratore(collaboratore.id));
  }

  return (
    <article
      className={`overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md ${
        collaboratore.attivo ? "" : "opacity-70"
      }`}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-start gap-3 text-left">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset ${getAvatarClasses(collaboratore.nome)}`}
            >
              {initials}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-base font-bold text-brand-text">{collaboratore.nome}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-2 py-0.5 text-[11px] font-semibold text-brand-soft ring-1 ring-inset ring-brand-border">
                  <TipoIcon tipo={collaboratore.tipo} />
                  {getTipoCollaboratoreLabel(collaboratore.tipo)}
                </span>
                {!collaboratore.attivo && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    Non attivo
                  </span>
                )}
              </span>
              <span className="mt-1 block text-xs text-brand-muted">
                {[collaboratore.contatto, collaboratore.iban].filter(Boolean).join(" · ") || "Nessun contatto"}
              </span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => run(() => updateCollaboratore(collaboratore.id, { attivo: !collaboratore.attivo }))}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-brand-soft ring-1 ring-inset ring-brand-border transition hover:text-brand-text"
            >
              {collaboratore.attivo ? "Disattiva" : "Riattiva"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              aria-label={`Elimina ${collaboratore.nome}`}
              className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-accent/10 hover:text-brand-accent-light"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={expanded ? "Chiudi dettagli" : "Apri dettagli"}
              className="rounded-lg p-1.5 text-brand-muted transition hover:text-brand-text"
            >
              <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatChip icon={Phone} label="Numeri presi" value={`${collaboratore.statsContatti.numeriPresi}`} />
          <StatChip icon={CheckCircle2} label="Attivi" value={`${collaboratore.statsContatti.attivi}`} />
          <StatChip icon={Phone} label="Da richiamare" value={`${collaboratore.statsContatti.daRichiamare}`} highlight={collaboratore.statsContatti.daRichiamare > 0} />
          <StatChip icon={Users} label="Hanno detto no" value={`${collaboratore.statsContatti.hannoDettoNo}`} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatChip icon={CheckCircle2} label="Chiusi" value={`${stats.chiusiCount}`} />
          <StatChip icon={Percent} label="% default" value={`${Number(collaboratore.percentuale)}%`} />
          <StatChip icon={Banknote} label="Dovuto" value={formatEuro(stats.dovuto)} />
          <StatChip
            icon={Banknote}
            label="Da mandare"
            value={formatEuro(stats.daMandare)}
            highlight={stats.daMandare > 0}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-brand-border bg-brand-surface px-3 py-3">
          <p className="text-xs text-brand-muted">Link personale da mandare a {collaboratore.nome}</p>
          <CopiaLinkPortaleButton token={collaboratore.token} nome={collaboratore.nome} />
          <a
            href={`/dashboard/collaboratori/${collaboratore.id}`}
            className="text-xs font-semibold text-brand-accent-light hover:underline"
          >
            Vedi i suoi numeri nel gestionale
          </a>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-brand-border p-4 sm:p-5">
          {errorMessage && (
            <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-2.5 text-xs text-brand-accent-light">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-36">
              <label htmlFor={`perc-${collaboratore.id}`} className={LABEL}>
                Percentuale default
              </label>
              <input
                id={`perc-${collaboratore.id}`}
                type="text"
                inputMode="decimal"
                value={percentuale}
                onChange={(event) => setPercentuale(event.target.value)}
                onBlur={handlePercentualeBlur}
                className={INPUT}
              />
            </div>
          <p className="text-xs text-brand-muted sm:flex-1">
            Se chiude un progetto, gli spettano <strong className="text-brand-soft">prezzo × %</strong>.
            Totale chiuso: <strong className="text-brand-soft">{formatEuro(stats.totalePreventivato)}</strong>
            {" · "}già pagato: <strong className="text-brand-soft">{formatEuro(stats.pagato)}</strong>
          </p>
            {stats.daMandare > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm(`Segnare come pagato tutto il residuo di ${formatEuro(stats.daMandare)}?`)) {
                    return;
                  }
                  run(() => pagaTuttoCollaboratore(collaboratore.id));
                }}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                Paga tutto il residuo
              </button>
            )}
          </div>

          {collaboratore.note && (
            <p className="text-xs text-brand-muted">Note: {collaboratore.note}</p>
          )}

          <NuovoLavoroForm
            collaboratore={collaboratore}
            preventivi={preventivi}
            disabled={isPending}
            onSubmit={(input) => run(() => createLavoro(input))}
          />

          <LavoriTable
            lavori={collaboratore.lavori}
            disabled={isPending}
            onPagaResiduo={(id) => run(() => pagaResiduoLavoro(id))}
            onPagaParziale={(id, importo) => run(() => registraPagamento(id, importo))}
            onPercentuale={(id, value) => run(() => updateLavoroPercentuale(id, value))}
            onDelete={(id) => {
              if (!window.confirm("Togliere questo preventivo dal collaboratore?")) return;
              run(() => deleteLavoro(id));
            }}
          />
        </div>
      )}
    </article>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold ${highlight ? "text-amber-300" : "text-brand-text"}`}>{value}</p>
    </div>
  );
}

function NuovoLavoroForm({
  collaboratore,
  preventivi,
  disabled,
  onSubmit,
}: {
  collaboratore: Collaboratore;
  preventivi: PreventivoOption[];
  disabled: boolean;
  onSubmit: (input: Parameters<typeof createLavoro>[0]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [preventivoId, setPreventivoId] = useState("");
  const [cliente, setCliente] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [percentuale, setPercentuale] = useState(String(collaboratore.percentuale));
  const [data, setData] = useState(todayIsoDate());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const assegnati = useMemo(
    () => new Set(collaboratore.lavori.map((lavoro) => lavoro.preventivo_id).filter(Boolean)),
    [collaboratore.lavori]
  );

  const disponibili = preventivi.filter((preventivo) => !assegnati.has(preventivo.id));

  function handlePreventivoChange(id: string) {
    setPreventivoId(id);
    const preventivo = preventivi.find((item) => item.id === id);
    if (!preventivo) return;
    setCliente(labelPreventivo(preventivo));
    setPrezzo(preventivo.prezzo != null ? String(preventivo.prezzo) : "");
    setData(preventivo.data_invio || todayIsoDate());
    setDescrizione(preventivo.numero_preventivo ? `Preventivo ${preventivo.numero_preventivo}` : "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const prezzoNumerico = Number(prezzo.replace(",", "."));
    const percentualeNumerica = Number(percentuale.replace(",", "."));
    if (!prezzo || Number.isNaN(prezzoNumerico) || prezzoNumerico <= 0) {
      setErrorMessage("Inserisci il prezzo del preventivo.");
      return;
    }
    if (Number.isNaN(percentualeNumerica) || percentualeNumerica < 0 || percentualeNumerica > 100) {
      setErrorMessage("La percentuale deve essere tra 0 e 100.");
      return;
    }

    onSubmit({
      collaboratore_id: collaboratore.id,
      preventivo_id: preventivoId || null,
      cliente: cliente.trim() || null,
      descrizione: descrizione.trim() || null,
      prezzo: prezzoNumerico,
      percentuale: percentualeNumerica,
      data,
      note: null,
    });
    setPreventivoId("");
    setCliente("");
    setDescrizione("");
    setPrezzo("");
    setPercentuale(String(collaboratore.percentuale));
    setData(todayIsoDate());
    setIsOpen(false);
  }

  const preview = (() => {
    const prezzoNumerico = Number(prezzo.replace(",", "."));
    const percentualeNumerica = Number(percentuale.replace(",", "."));
    if (Number.isNaN(prezzoNumerico) || Number.isNaN(percentualeNumerica)) return null;
    return importoDovuto(prezzoNumerico, percentualeNumerica);
  })();

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong bg-brand-surface px-3.5 py-1.5 text-xs font-semibold text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light"
      >
        {isOpen ? "Chiudi" : "+ Collega un progetto chiuso"}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4">
          {errorMessage && (
            <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-2 text-xs text-brand-accent-light">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor={`prv-${collaboratore.id}`} className={LABEL}>
              Preventivo esistente (opzionale)
            </label>
            <select
              id={`prv-${collaboratore.id}`}
              value={preventivoId}
              onChange={(event) => handlePreventivoChange(event.target.value)}
              className={INPUT}
            >
              <option value="">Lavoro libero, senza preventivo in elenco</option>
              {disponibili.map((preventivo) => (
                <option key={preventivo.id} value={preventivo.id}>
                  {labelPreventivo(preventivo)}
                  {preventivo.prezzo != null ? ` · ${formatEuro(preventivo.prezzo)}` : ""}
                  {` · ${getStatoPreventivoLabel(preventivo.stato)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor={`cli-${collaboratore.id}`}>
                Cliente
              </label>
              <input
                id={`cli-${collaboratore.id}`}
                value={cliente}
                onChange={(event) => setCliente(event.target.value)}
                className={INPUT}
                placeholder="Nome cliente"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor={`desc-${collaboratore.id}`}>
                Descrizione
              </label>
              <input
                id={`desc-${collaboratore.id}`}
                value={descrizione}
                onChange={(event) => setDescrizione(event.target.value)}
                className={INPUT}
                placeholder="Es. Sviluppo app, referral..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={LABEL} htmlFor={`prz-${collaboratore.id}`}>
                Prezzo preventivo (€)
              </label>
              <input
                id={`prz-${collaboratore.id}`}
                value={prezzo}
                onChange={(event) => setPrezzo(event.target.value)}
                inputMode="decimal"
                className={INPUT}
                placeholder="4500"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor={`pct-${collaboratore.id}`}>
                % da dare
              </label>
              <input
                id={`pct-${collaboratore.id}`}
                value={percentuale}
                onChange={(event) => setPercentuale(event.target.value)}
                inputMode="decimal"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor={`data-${collaboratore.id}`}>
                Data
              </label>
              <input
                id={`data-${collaboratore.id}`}
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                className={INPUT}
              />
            </div>
            <div className="flex flex-col justify-end">
            <p className="text-[11px] text-brand-muted">Gli spettano</p>
              <p className="text-sm font-bold text-amber-300">
                {preview != null ? formatEuro(preview) : "—"}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {disabled && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Aggiungi
          </button>
        </form>
      )}
    </div>
  );
}

function LavoriTable({
  lavori,
  disabled,
  onPagaResiduo,
  onPagaParziale,
  onPercentuale,
  onDelete,
}: {
  lavori: CollaboratoreLavoro[];
  disabled: boolean;
  onPagaResiduo: (id: string) => void;
  onPagaParziale: (id: string, importo: number) => void;
  onPercentuale: (id: string, percentuale: number) => void;
  onDelete: (id: string) => void;
}) {
  if (lavori.length === 0) {
    return <p className="text-sm text-brand-muted">Nessun preventivo collegato a questa persona.</p>;
  }

  return (
    <ul className="divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
      {lavori.map((lavoro) => (
        <LavoroRow
          key={lavoro.id}
          lavoro={lavoro}
          disabled={disabled}
          onPagaResiduo={() => onPagaResiduo(lavoro.id)}
          onPagaParziale={(importo) => onPagaParziale(lavoro.id, importo)}
          onPercentuale={(value) => onPercentuale(lavoro.id, value)}
          onDelete={() => onDelete(lavoro.id)}
        />
      ))}
    </ul>
  );
}

function LavoroRow({
  lavoro,
  disabled,
  onPagaResiduo,
  onPagaParziale,
  onPercentuale,
  onDelete,
}: {
  lavoro: CollaboratoreLavoro;
  disabled: boolean;
  onPagaResiduo: () => void;
  onPagaParziale: (importo: number) => void;
  onPercentuale: (percentuale: number) => void;
  onDelete: () => void;
}) {
  const [percentuale, setPercentuale] = useState(String(lavoro.percentuale));
  const [pagamento, setPagamento] = useState("");
  const dovuto = importoDovuto(lavoro.prezzo, lavoro.percentuale);
  const residuo = residuoLavoro(lavoro);
  const chiuso = !lavoro.preventivo || isPreventivoChiuso(lavoro.preventivo.stato);

  function commitPercentuale() {
    const value = Number(percentuale.replace(",", "."));
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setPercentuale(String(lavoro.percentuale));
      return;
    }
    if (value === Number(lavoro.percentuale)) return;
    onPercentuale(value);
  }

  function commitPagamento() {
    const value = Number(pagamento.replace(",", "."));
    if (Number.isNaN(value) || value <= 0) return;
    onPagaParziale(value);
    setPagamento("");
  }

  return (
    <li className="space-y-3 bg-brand-surface/40 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-text">{clienteLavoro(lavoro)}</p>
          <p className="mt-0.5 text-xs text-brand-muted">
            {formatDataBreve(lavoro.data)}
            {lavoro.preventivo ? ` · ${getStatoPreventivoLabel(lavoro.preventivo.stato)}` : " · lavoro libero"}
            {chiuso ? " · chiuso" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="rounded-lg p-1.5 text-brand-muted hover:text-brand-accent-light"
          aria-label="Rimuovi lavoro"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <p className="text-brand-muted">Prezzo</p>
          <p className="font-semibold text-brand-text">{formatEuro(lavoro.prezzo)}</p>
        </div>
        <div>
          <p className="text-brand-muted">% da dare</p>
          <input
            value={percentuale}
            onChange={(event) => setPercentuale(event.target.value)}
            onBlur={commitPercentuale}
            disabled={disabled}
            className="mt-0.5 w-20 rounded-md border border-brand-border-strong bg-brand-surface px-2 py-1 text-xs font-semibold text-brand-text"
          />
        </div>
        <div>
          <p className="text-brand-muted">Dovuto</p>
          <p className="font-semibold text-brand-text">{formatEuro(dovuto)}</p>
        </div>
        <div>
          <p className="text-brand-muted">Da mandare</p>
          <p className={`font-bold ${residuo > 0 ? "text-amber-300" : "text-emerald-300"}`}>
            {residuo > 0 ? formatEuro(residuo) : "Saldato"}
          </p>
        </div>
      </div>

      {residuo > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={pagamento}
            onChange={(event) => setPagamento(event.target.value)}
            inputMode="decimal"
            placeholder="Importo pagato"
            className="w-32 rounded-md border border-brand-border-strong bg-brand-surface px-2 py-1.5 text-xs text-brand-text"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={commitPagamento}
            className="rounded-full border border-brand-border px-3 py-1.5 text-[11px] font-semibold text-brand-soft"
          >
            Registra acconto
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onPagaResiduo}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white"
          >
            Saldato
          </button>
          <span className="text-[11px] text-brand-muted">già pagato {formatEuro(lavoro.importo_pagato)}</span>
        </div>
      )}
    </li>
  );
}
