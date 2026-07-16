"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  STATO_BADGE_CLASSES,
  STATO_OPTIONS,
  STATO_SUMMARY_LABELS,
  type StatoRichiesta,
} from "@/lib/richieste/stato";
import { formatDataBreve } from "@/lib/richieste/format";
import { StatoBadge } from "./StatoBadge";

export type RichiestaListItem = {
  id: string;
  nome: string;
  cognome: string;
  tipo_cliente: string;
  nome_azienda: string | null;
  budget: string | null;
  tempistiche: string | null;
  stato: string;
  created_at: string;
};

type RichiesteTableProps = {
  richieste: RichiestaListItem[];
};

export function RichiesteTable({ richieste }: RichiesteTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statoFilter, setStatoFilter] = useState("");

  const conteggiPerStato = useMemo(() => {
    const counts: Partial<Record<StatoRichiesta, number>> = {};
    for (const richiesta of richieste) {
      const stato = richiesta.stato as StatoRichiesta;
      counts[stato] = (counts[stato] ?? 0) + 1;
    }
    return counts;
  }, [richieste]);

  const richiesteFiltrate = useMemo(() => {
    const term = search.trim().toLowerCase();
    return richieste.filter((richiesta) => {
      if (statoFilter && richiesta.stato !== statoFilter) return false;
      if (!term) return true;
      const haystack = `${richiesta.nome} ${richiesta.cognome} ${richiesta.nome_azienda ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [richieste, search, statoFilter]);

  function toggleStatoChip(stato: string) {
    setStatoFilter((current) => (current === stato ? "" : stato));
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatoFilter(event.target.value);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">
          {richieste.length} {richieste.length === 1 ? "richiesta totale" : "richieste totali"}
        </span>

        {STATO_OPTIONS.map((option) => {
          const count = conteggiPerStato[option.value] ?? 0;
          if (count === 0) return null;
          const isActive = statoFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleStatoChip(option.value)}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition ${
                STATO_BADGE_CLASSES[option.value]
              } ${isActive ? "ring-2" : "opacity-80 hover:opacity-100"}`}
            >
              {count} {STATO_SUMMARY_LABELS[option.value]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Cerca per nome, cognome o azienda..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={statoFilter}
          onChange={handleSelectChange}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-56"
        >
          <option value="">Tutti gli stati</option>
          {STATO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Nome Cognome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Budget
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tempistiche
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stato
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {richiesteFiltrate.length > 0 ? (
                richiesteFiltrate.map((richiesta) => (
                  <tr
                    key={richiesta.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/${richiesta.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") router.push(`/dashboard/${richiesta.id}`);
                    }}
                    className="cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {richiesta.nome} {richiesta.cognome}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {richiesta.tipo_cliente === "azienda" ? (
                        <>
                          Azienda
                          {richiesta.nome_azienda && (
                            <span className="text-gray-400"> · {richiesta.nome_azienda}</span>
                          )}
                        </>
                      ) : (
                        "Privato"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {richiesta.budget ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {richiesta.tempistiche ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatoBadge stato={richiesta.stato} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDataBreve(richiesta.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nessuna richiesta trovata.
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
