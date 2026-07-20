"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  SearchX,
  Trash2,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractStoragePath } from "@/lib/storage/signedUrl";
import { formatEuro } from "@/lib/richieste/format";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";
import {
  STATO_PREVENTIVO_DEFAULT,
  STATO_PREVENTIVO_OPTIONS,
  isPreventivoAttivo,
  type StatoPreventivo,
} from "@/lib/preventivi/stato";
import { StatoPreventivoBadge } from "./StatoPreventivoBadge";

const BUCKET = "preventivi-clienti";

type FiltroPreventivi = "tutti" | "attivi" | "non_attivi";

const FILTRI: { id: FiltroPreventivi; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "attivi", label: "Attivi" },
  { id: "non_attivi", label: "Non attivi" },
];

export type PreventivoListaItem = {
  id: string;
  numero_preventivo: string | null;
  data_invio: string;
  nome_file: string;
  url_file: string;
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  prezzo: number | null;
  stato: string;
  downloadUrl: string | null;
  richiesta: { id: string; nome: string; cognome: string } | null;
};

function formatDataInvio(value: string) {
  const [anno, mese, giorno] = value.split("-").map(Number);
  const date = anno && mese && giorno ? new Date(anno, mese - 1, giorno) : new Date(value);
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function getCliente(preventivo: PreventivoListaItem) {
  if (preventivo.richiesta) {
    return {
      id: preventivo.richiesta.id,
      nome: preventivo.richiesta.nome,
      cognome: preventivo.richiesta.cognome,
      azienda: preventivo.azienda,
      href: `/dashboard/${preventivo.richiesta.id}`,
    };
  }

  return {
    id: preventivo.id,
    nome: preventivo.nome ?? "",
    cognome: preventivo.cognome ?? "",
    azienda: preventivo.azienda,
    href: null as string | null,
  };
}

function EmptyState({ filtro }: { filtro: FiltroPreventivi }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
        <SearchX className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-brand-soft">
        {filtro === "tutti"
          ? "Nessun preventivo caricato."
          : filtro === "attivi"
            ? "Nessun preventivo attivo."
            : "Nessun preventivo non attivo."}
      </p>
      <p className="text-xs text-brand-muted">
        {filtro === "tutti"
          ? "Clicca “Nuovo preventivo” per crearne uno."
          : "Prova a cambiare filtro in alto."}
      </p>
    </div>
  );
}

function sumPrezzi(items: PreventivoListaItem[]) {
  return items.reduce((sum, item) => sum + (item.prezzo != null ? Number(item.prezzo) : 0), 0);
}

export function PreventiviLista({ preventiviIniziali }: { preventiviIniziali: PreventivoListaItem[] }) {
  const router = useRouter();
  const [preventivi, setPreventivi] = useState(preventiviIniziali);
  const [filtro, setFiltro] = useState<FiltroPreventivi>("tutti");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPreventivi(preventiviIniziali);
  }, [preventiviIniziali]);

  const attivi = useMemo(
    () => preventivi.filter((item) => isPreventivoAttivo(item.stato)),
    [preventivi]
  );
  const nonAttivi = useMemo(
    () => preventivi.filter((item) => !isPreventivoAttivo(item.stato)),
    [preventivi]
  );

  const filtrati = useMemo(() => {
    if (filtro === "attivi") return attivi;
    if (filtro === "non_attivi") return nonAttivi;
    return preventivi;
  }, [filtro, preventivi, attivi, nonAttivi]);

  const totaleTutti = useMemo(() => sumPrezzi(preventivi), [preventivi]);
  const totaleAttivi = useMemo(() => sumPrezzi(attivi), [attivi]);
  const totaleNonAttivi = useMemo(() => sumPrezzi(nonAttivi), [nonAttivi]);
  const totaleFiltrato = useMemo(() => sumPrezzi(filtrati), [filtrati]);

  async function handleStatoChange(preventivo: PreventivoListaItem, stato: StatoPreventivo) {
    if (preventivo.stato === stato) return;

    setUpdatingId(preventivo.id);
    setErrorMessage(null);
    const previous = preventivo.stato;
    setPreventivi((current) =>
      current.map((item) => (item.id === preventivo.id ? { ...item, stato } : item))
    );

    const supabase = createClient();
    const { error } = await supabase.from("preventivi").update({ stato }).eq("id", preventivo.id);

    if (error) {
      setPreventivi((current) =>
        current.map((item) => (item.id === preventivo.id ? { ...item, stato: previous } : item))
      );
      setErrorMessage(error.message);
      setUpdatingId(null);
      return;
    }

    setUpdatingId(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete(preventivo: PreventivoListaItem) {
    const cliente = getCliente(preventivo);
    const label = `${cliente.nome} ${cliente.cognome}`.trim() || preventivo.nome_file;
    if (!window.confirm(`Eliminare il preventivo di ${label}?`)) {
      return;
    }

    setDeletingId(preventivo.id);
    setErrorMessage(null);
    const supabase = createClient();

    const path = extractStoragePath(BUCKET, preventivo.url_file);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error } = await supabase.from("preventivi").delete().eq("id", preventivo.id);
    if (error) {
      setErrorMessage(error.message);
      setDeletingId(null);
      return;
    }

    setPreventivi((current) => current.filter((item) => item.id !== preventivo.id));
    setDeletingId(null);
    startTransition(() => router.refresh());
  }

  function StatoSelect({ preventivo }: { preventivo: PreventivoListaItem }) {
    return (
      <div className="flex flex-col gap-1.5">
        <StatoPreventivoBadge stato={preventivo.stato || STATO_PREVENTIVO_DEFAULT} />
        <select
          value={preventivo.stato || STATO_PREVENTIVO_DEFAULT}
          disabled={updatingId === preventivo.id}
          onChange={(event) =>
            handleStatoChange(preventivo, event.target.value as StatoPreventivo)
          }
          aria-label="Cambia stato preventivo"
          className="w-full rounded-lg border border-brand-border-strong bg-brand-surface px-2 py-1.5 text-xs font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-60"
        >
          {STATO_PREVENTIVO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:col-span-1 sm:p-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent-light ring-1 ring-inset ring-brand-accent/25 sm:h-9 sm:w-9">
            <Wallet className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
          </span>
          <p className="mt-2.5 text-xl font-extrabold tracking-[-0.02em] text-brand-text sm:mt-3 sm:text-2xl">
            {formatEuro(totaleTutti)}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-brand-muted sm:text-xs">
            Totale preventivato · {preventivi.length}
          </p>
        </div>
        <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25 sm:h-9 sm:w-9">
            <FileText className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
          </span>
          <p className="mt-2.5 text-xl font-extrabold tracking-[-0.02em] text-amber-300 sm:mt-3 sm:text-2xl">
            {formatEuro(totaleAttivi)}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-brand-muted sm:text-xs">
            Attivi · {attivi.length}
          </p>
        </div>
        <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25 sm:h-9 sm:w-9">
            <CheckCircle2 className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
          </span>
          <p className="mt-2.5 text-xl font-extrabold tracking-[-0.02em] text-emerald-300 sm:mt-3 sm:text-2xl">
            {formatEuro(totaleNonAttivi)}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-brand-muted sm:text-xs">
            Non attivi · {nonAttivi.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-brand-border-strong bg-brand-surface p-1 sm:inline-flex sm:w-auto">
          {FILTRI.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={`min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                filtro === item.id
                  ? "bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] text-white shadow-sm"
                  : "text-brand-muted hover:bg-brand-border-strong hover:text-brand-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-brand-soft">
          Totale vista:{" "}
          <span className="text-brand-text">{formatEuro(totaleFiltrato)}</span>
          <span className="ml-1 text-xs font-medium text-brand-muted">
            ({filtrati.length})
          </span>
        </p>
      </div>

      <div
        className={`overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md ${isPending ? "opacity-70" : ""}`}
      >
      {errorMessage && (
        <div className="border-b border-brand-accent/40 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent-light">
          {errorMessage}
        </div>
      )}

      <div className="md:hidden">
        {filtrati.length > 0 ? (
          <ul className="divide-y divide-brand-border">
            {filtrati.map((preventivo) => {
              const cliente = getCliente(preventivo);
              const nomeCompleto = `${cliente.nome} ${cliente.cognome}`.trim() || "—";
              const avatarClasses = getAvatarClasses(cliente.id);

              return (
                <li key={preventivo.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${avatarClasses}`}
                    >
                      {cliente.nome || cliente.cognome
                        ? getInitials(cliente.nome, cliente.cognome)
                        : "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      {cliente.href ? (
                        <Link href={cliente.href} className="text-sm font-semibold text-brand-text">
                          {nomeCompleto}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-brand-text">{nomeCompleto}</p>
                      )}
                      {cliente.azienda && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
                          <Building2 className="h-3 w-3" />
                          {cliente.azienda}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-brand-muted">
                        {formatDataInvio(preventivo.data_invio)}
                        {preventivo.prezzo != null ? ` · ${formatEuro(Number(preventivo.prezzo))}` : ""}
                      </p>
                      <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-brand-soft">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-brand-accent-light" />
                        <span className="truncate">{preventivo.nome_file}</span>
                      </p>
                      <div className="mt-3">
                        <StatoSelect preventivo={preventivo} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {preventivo.downloadUrl ? (
                      <a
                        href={preventivo.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-3 text-sm font-semibold text-brand-soft transition active:bg-brand-accent/10"
                      >
                        <Download className="h-4 w-4" />
                        Scarica
                      </a>
                    ) : (
                      <span className="flex min-h-10 flex-1 items-center justify-center text-xs text-brand-accent-light">
                        Download non disponibile
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(preventivo)}
                      disabled={deletingId === preventivo.id}
                      aria-label={`Elimina preventivo ${nomeCompleto}`}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-soft transition active:bg-brand-accent/10 disabled:opacity-50"
                    >
                      {deletingId === preventivo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState filtro={filtro} />
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-surface/60">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Cliente
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Azienda
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Data
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Prezzo
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Stato
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                File
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filtrati.length > 0 ? (
              filtrati.map((preventivo) => {
                const cliente = getCliente(preventivo);
                const nomeCompleto = `${cliente.nome} ${cliente.cognome}`.trim() || "—";
                const avatarClasses = getAvatarClasses(cliente.id);

                const clienteCell = (
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${avatarClasses}`}
                    >
                      {cliente.nome || cliente.cognome
                        ? getInitials(cliente.nome, cliente.cognome)
                        : "?"}
                    </span>
                    <span className="text-sm font-medium text-brand-soft">{nomeCompleto}</span>
                  </div>
                );

                return (
                  <tr key={preventivo.id} className="group transition-colors hover:bg-brand-accent/5">
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {cliente.href ? (
                        <Link href={cliente.href} className="block">
                          {clienteCell}
                        </Link>
                      ) : (
                        clienteCell
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-muted">
                      {cliente.azienda ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {cliente.azienda}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-muted">
                      {formatDataInvio(preventivo.data_invio)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-brand-text">
                      {preventivo.prezzo != null ? formatEuro(Number(preventivo.prezzo)) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatoSelect preventivo={preventivo} />
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-3.5 text-sm text-brand-soft">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-brand-accent-light" />
                        <span className="truncate">{preventivo.nome_file}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {preventivo.downloadUrl ? (
                          <a
                            href={preventivo.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Scarica ${preventivo.nome_file}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-brand-accent-light">N/D</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(preventivo)}
                          disabled={deletingId === preventivo.id}
                          aria-label={`Elimina preventivo ${nomeCompleto}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light disabled:opacity-50"
                        >
                          {deletingId === preventivo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <EmptyState filtro={filtro} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
