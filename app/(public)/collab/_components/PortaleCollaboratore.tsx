"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CalendarClock,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  addContattoPortale,
  deleteContattoPortale,
  importContattiPortale,
  updateStatoContattoPortale,
} from "../actions";
import {
  FILTRI_STATO_CONTATTO,
  STATO_CONTATTO_LABELS,
  isRichiamoUrgente,
  riepilogoContatti,
  type ContattoCollaboratore,
  type StatoContatto,
} from "@/lib/collaboratori/types";
import { LiveRefresh } from "@/app/(admin)/dashboard/_components/LiveRefresh";
import { refreshTutti } from "@/lib/live/browser";

const INPUT =
  "w-full rounded-lg border border-brand-border-strong bg-brand-surface px-3 py-3 text-base text-brand-text placeholder:text-brand-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent sm:py-2 sm:text-sm";
const LABEL = "mb-1 block text-xs font-medium text-brand-soft";

function formatQuando(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statoClass(stato: StatoContatto, urgente = false) {
  if (urgente) return "bg-brand-accent/20 text-brand-accent-light ring-brand-accent/40";
  switch (stato) {
    case "interessato":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "da_richiamare":
      return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
    case "call_fissata":
      return "bg-blue-500/15 text-blue-300 ring-blue-500/30";
    case "non_interessato":
      return "bg-white/5 text-brand-muted ring-brand-border";
    case "chiamato":
      return "bg-violet-500/15 text-violet-300 ring-violet-500/30";
    default:
      return "bg-brand-surface text-brand-soft ring-brand-border";
  }
}

export function PortaleCollaboratore({
  nome,
  token,
  contatti,
}: {
  nome: string;
  token: string;
  contatti: ContattoCollaboratore[];
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"tutti" | StatoContatto>("tutti");
  const [mostraForm, setMostraForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = riepilogoContatti(contatti);
  const callFissate = useMemo(
    () =>
      contatti
        .filter((item) => item.stato === "call_fissata" && item.data_call)
        .sort((a, b) => String(a.data_call).localeCompare(String(b.data_call))),
    [contatti]
  );
  const visibili = contatti.filter((item) => (filtro === "tutti" ? true : item.stato === filtro));

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErrorMessage(null);
    setImportInfo(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setErrorMessage(result.error);
      else refreshTutti(router);
    });
  }

  function scaricaModello() {
    const csv =
      "Nome Azienda,Referente,Telefono,Email,Note\nEdilnova Srl,Luca Ferri,333 210 4488,luca.ferri@edilnova.it,Chiedere del sito vetrina\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modello-contatti-devology.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    setErrorMessage(null);
    setImportInfo(null);
    startTransition(async () => {
      const result = await importContattiPortale(token, formData);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      setImportInfo(`${result.importati} contatti importati, ${result.duplicati} duplicati saltati.`);
      refreshTutti(router);
    });
  }

  return (
    <main className="min-h-dvh bg-brand-bg bg-brand-grid bg-[length:40px_40px] px-4 py-6 pb-16 sm:px-6">
      <LiveRefresh />
      <div className="mx-auto w-full max-w-lg">
        <Image
          src="/logo/devology-logo-full.svg"
          alt="Devology System"
          width={200}
          height={125}
          priority
          className="h-10 w-auto"
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Portale collaboratore
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text">Ciao, {nome}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          Carichi i numeri (Excel o a mano), li chiami, e segni come è andata. Devology vede gli stessi
          conteggi: numeri presi, attivi, da richiamare, hanno detto no.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Kpi label="Numeri presi" value={stats.numeriPresi} />
          <Kpi label="Attivi" value={stats.attivi} tone="positive" />
          <Kpi label="Da richiamare" value={stats.daRichiamare} tone="warn" />
          <Kpi label="Hanno detto no" value={stats.hannoDettoNo} />
        </div>
        <p className="mt-2 text-[11px] text-brand-muted">
          Da chiamare {stats.daChiamare} · Chiamati {stats.chiamato} · Call fissate {stats.callFissate}
        </p>

        {errorMessage && (
          <p className="mt-4 rounded-md border border-brand-accent/40 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent-light">
            {errorMessage}
          </p>
        )}
        {importInfo && (
          <p className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {importInfo}
          </p>
        )}

        <section className="mt-6 rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md">
          <h2 className="flex items-center gap-2 text-sm font-bold text-brand-text">
            <CalendarClock className="h-4 w-4 text-brand-accent-light" />
            Le mie call fissate
          </h2>
          {callFissate.length === 0 ? (
            <p className="mt-2 text-sm text-brand-muted">Nessuna call in programma. Quando ne fissi una, compare qui.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {callFissate.map((call) => (
                <li key={call.id} className="rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5">
                  <p className="text-sm font-semibold text-brand-text">
                    {call.nome_azienda || call.referente || "Contatto"}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {formatQuando(call.data_call)}
                    {call.referente ? ` · ${call.referente}` : ""}
                    {call.telefono ? ` · ${call.telefono}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={scaricaModello}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-3.5 py-2 text-xs font-semibold text-brand-soft"
          >
            <Download className="h-3.5 w-3.5" />
            Modello Excel
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-3.5 py-2 text-xs font-semibold text-brand-soft"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Importa Excel
          </button>
          <button
            type="button"
            onClick={() => setMostraForm((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-3.5 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo contatto
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImport(file);
              event.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-brand-muted">
          <FileSpreadsheet className="h-3 w-3" />
          Colonne: Nome Azienda, Referente, Telefono, Email, Note.
        </p>

        {mostraForm && (
          <NuovoContattoForm
            pending={isPending}
            onCancel={() => setMostraForm(false)}
            onSubmit={(input) =>
              run(async () => {
                const result = await addContattoPortale(token, input);
                if (result.ok) setMostraForm(false);
                return result;
              })
            }
          />
        )}

        <div className="mt-5 flex gap-1 overflow-x-auto pb-1">
          {FILTRI_STATO_CONTATTO.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFiltro(item.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                filtro === item.value
                  ? "bg-brand-accent/20 text-brand-accent-light ring-1 ring-inset ring-brand-accent/40"
                  : "bg-brand-elevated text-brand-muted ring-1 ring-inset ring-brand-border"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-3">
          {visibili.length === 0 ? (
            <li className="rounded-brand-lg border border-brand-border bg-brand-elevated px-4 py-10 text-center text-sm text-brand-muted">
              Nessun contatto in questo filtro.
            </li>
          ) : (
            visibili.map((contatto) => (
              <ContattoCard
                key={contatto.id}
                contatto={contatto}
                pending={isPending}
                onStato={(stato, extra) =>
                  run(() => updateStatoContattoPortale(token, contatto.id, stato, extra))
                }
                onDelete={() => {
                  if (!window.confirm("Eliminare questo contatto?")) return;
                  run(() => deleteContattoPortale(token, contatto.id));
                }}
              />
            ))
          )}
        </ul>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "warn";
}) {
  const valueClass =
    tone === "positive" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-brand-text";
  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3 shadow-brand-md">
      <p className={`text-xl font-extrabold ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-brand-muted">{label}</p>
    </div>
  );
}

function NuovoContattoForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    nome_azienda: string | null;
    referente: string | null;
    telefono: string | null;
    email: string | null;
    note: string | null;
    stato: "da_chiamare";
    data_richiamo: null;
    data_call: null;
  }) => void;
}) {
  const [azienda, setAzienda] = useState("");
  const [referente, setReferente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!azienda.trim() && !referente.trim() && !telefono.trim()) return;
    onSubmit({
      nome_azienda: azienda.trim() || null,
      referente: referente.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      note: note.trim() || null,
      stato: "da_chiamare",
      data_richiamo: null,
      data_call: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-brand-lg border border-brand-border bg-brand-elevated p-4">
      <label className="block">
        <span className={LABEL}>Azienda</span>
        <input value={azienda} onChange={(event) => setAzienda(event.target.value)} className={INPUT} />
      </label>
      <label className="block">
        <span className={LABEL}>Referente</span>
        <input value={referente} onChange={(event) => setReferente(event.target.value)} className={INPUT} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={LABEL}>Telefono</span>
          <input value={telefono} onChange={(event) => setTelefono(event.target.value)} className={INPUT} />
        </label>
        <label className="block">
          <span className={LABEL}>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT} />
        </label>
      </div>
      <label className="block">
        <span className={LABEL}>Note</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className={`${INPUT} resize-y`} />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-2 text-xs font-semibold text-brand-muted">
          Annulla
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-3.5 py-2 text-xs font-semibold text-white"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Aggiungi
        </button>
      </div>
    </form>
  );
}

function ContattoCard({
  contatto,
  pending,
  onStato,
  onDelete,
}: {
  contatto: ContattoCollaboratore;
  pending: boolean;
  onStato: (stato: StatoContatto, extra?: { data_richiamo?: string | null; data_call?: string | null }) => void;
  onDelete: () => void;
}) {
  const [quando, setQuando] = useState("");
  const [chiede, setChiede] = useState<"da_richiamare" | "call_fissata" | null>(null);
  const urgente = isRichiamoUrgente(contatto);

  function confermaQuando() {
    if (!quando) return;
    const iso = new Date(quando).toISOString();
    if (chiede === "da_richiamare") onStato("da_richiamare", { data_richiamo: iso });
    if (chiede === "call_fissata") onStato("call_fissata", { data_call: iso });
    setChiede(null);
    setQuando("");
  }

  return (
    <li className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-brand-text">
            {contatto.nome_azienda || contatto.referente || "Senza nome"}
          </p>
          {contatto.referente && contatto.nome_azienda && (
            <p className="text-xs text-brand-muted">{contatto.referente}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${statoClass(contatto.stato, urgente)}`}
        >
          {urgente ? "Richiamo ora" : STATO_CONTATTO_LABELS[contatto.stato]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-muted">
        {contatto.telefono && (
          <a href={`tel:${contatto.telefono.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-brand-accent-light">
            <Phone className="h-3 w-3" />
            {contatto.telefono}
          </a>
        )}
        {contatto.email && (
          <a href={`mailto:${contatto.email}`} className="inline-flex items-center gap-1 truncate">
            <Mail className="h-3 w-3" />
            {contatto.email}
          </a>
        )}
      </div>
      {contatto.note && <p className="mt-2 text-xs text-brand-soft">{contatto.note}</p>}
      {contatto.stato === "da_richiamare" && contatto.data_richiamo && (
        <p className="mt-1 text-xs text-amber-300">Richiamo: {formatQuando(contatto.data_richiamo)}</p>
      )}
      {contatto.stato === "call_fissata" && contatto.data_call && (
        <p className="mt-1 text-xs text-blue-300">Call: {formatQuando(contatto.data_call)}</p>
      )}

      {chiede ? (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className={LABEL}>{chiede === "call_fissata" ? "Quando è la call?" : "Quando richiamare?"}</span>
            <input
              type="datetime-local"
              value={quando}
              onChange={(event) => setQuando(event.target.value)}
              className={INPUT}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setChiede(null)} className="text-xs font-semibold text-brand-muted">
              Annulla
            </button>
            <button
              type="button"
              onClick={confermaQuando}
              disabled={pending || !quando}
              className="rounded-full bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white"
            >
              Salva
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Azione label="Chiamato" onClick={() => onStato("chiamato")} />
          <Azione label="Da richiamare" onClick={() => setChiede("da_richiamare")} />
          <Azione label="Call fissata" onClick={() => setChiede("call_fissata")} />
          <Azione label="Interessato" onClick={() => onStato("interessato")} />
          <Azione label="Hanno detto no" onClick={() => onStato("non_interessato")} />
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-brand-muted hover:text-brand-accent-light"
            aria-label="Elimina contatto"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </li>
  );
}

function Azione({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-brand-border-strong px-2.5 py-1 text-[11px] font-semibold text-brand-soft hover:border-brand-accent/40 hover:text-brand-text"
    >
      {label}
    </button>
  );
}
