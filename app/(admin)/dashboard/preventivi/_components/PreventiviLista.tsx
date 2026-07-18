"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Download, FileText, Loader2, SearchX, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractStoragePath } from "@/lib/storage/signedUrl";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";

const BUCKET = "preventivi-clienti";

export type PreventivoListaItem = {
  id: string;
  numero_preventivo: string | null;
  data_invio: string;
  nome_file: string;
  url_file: string;
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
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

export function PreventiviLista({ preventiviIniziali }: { preventiviIniziali: PreventivoListaItem[] }) {
  const router = useRouter();
  const [preventivi, setPreventivi] = useState(preventiviIniziali);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
      {errorMessage && (
        <div className="border-b border-brand-accent/40 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent-light">
          {errorMessage}
        </div>
      )}

      <div className={`overflow-x-auto ${isPending ? "opacity-70" : ""}`}>
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
                File
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {preventivi.length > 0 ? (
              preventivi.map((preventivo) => {
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
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
                      <SearchX className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-brand-soft">Nessun preventivo caricato.</p>
                    <p className="text-xs text-brand-muted">
                      Usa il form sopra per crearne uno, oppure caricalo da una richiesta.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
