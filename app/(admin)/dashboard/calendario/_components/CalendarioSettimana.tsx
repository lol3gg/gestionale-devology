"use client";

import { useEffect, useMemo, useState } from "react";
import type { CallActionResult } from "@/lib/calendario/store";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";
import {
  CALL_DURATA_DEFAULT,
  GIORNI_SETT_BREVI,
  addGiorni,
  durataCall,
  formatGiornoCompleto,
  formatGiornoCorto,
  lunediDellaSettimana,
  oraCorrenteRoma,
  oraFineCall,
} from "@/lib/calendario/date";
import type { CallAppuntamento } from "@/lib/calendario/types";
import { CallFormModal, callToDraft, type CallFormDraft } from "./CallFormModal";

type CalendarioSettimanaProps = {
  lunedi: string;
  oggi: string;
  calls: CallAppuntamento[];
};

export function CalendarioSettimana({ lunedi, oggi, calls }: CalendarioSettimanaProps) {
  const giorni = useMemo(() => Array.from({ length: 7 }, (_, index) => addGiorni(lunedi, index)), [lunedi]);
  const [selectedDay, setSelectedDay] = useState(() => (giorni.includes(oggi) ? oggi : lunedi));
  const [draft, setDraft] = useState<CallFormDraft | null>(null);
  const [overlay, setOverlay] = useState<CallAppuntamento[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    const serverIds = new Set(calls.map((call) => call.id));
    setOverlay((current) => current.filter((call) => !serverIds.has(call.id)));
    setRemovedIds((current) => current.filter((id) => serverIds.has(id)));
  }, [calls]);

  useEffect(() => {
    setSelectedDay(giorni.includes(oggi) ? oggi : lunedi);
  }, [giorni, oggi, lunedi]);

  const localCalls = useMemo(() => {
    const byId = new Map(calls.map((call) => [call.id, call]));
    for (const call of overlay) byId.set(call.id, call);
    for (const id of removedIds) byId.delete(id);
    return Array.from(byId.values()).sort(
      (a, b) => a.giorno.localeCompare(b.giorno) || a.ora.localeCompare(b.ora)
    );
  }, [calls, overlay, removedIds]);

  function applyResult(result: CallActionResult & { ok: true }) {
    if (result.deletedId) {
      const id = result.deletedId;
      setRemovedIds((current) => (current.includes(id) ? current : [...current, id]));
      setOverlay((current) => current.filter((call) => call.id !== id));
      return;
    }
    if (!result.call) return;
    const saved = result.call;
    setOverlay((current) => [...current.filter((call) => call.id !== saved.id), saved]);
    setRemovedIds((current) => current.filter((id) => id !== saved.id));
    setSelectedDay(saved.giorno);
  }

  function openNuova(giorno: string) {
    setSelectedDay(giorno);
    setDraft({
      giorno,
      ora: giorno === oggi ? oraCorrenteRoma() : "16:00",
      durataMinuti: CALL_DURATA_DEFAULT,
      azienda: "",
      email: "",
      telefono: "",
      attivita: "",
    });
  }

  const settimanaPrec = addGiorni(lunedi, -7);
  const settimanaSucc = addGiorni(lunedi, 7);
  const lunediOggi = lunediDellaSettimana(oggi);
  const callsDelGiorno = localCalls.filter((call) => call.giorno === selectedDay);

  function CallCard({ call }: { call: CallAppuntamento }) {
    return (
      <button
        type="button"
        onClick={() => setDraft(callToDraft(call))}
        className="w-full rounded-xl border border-brand-border bg-brand-surface p-3 text-left transition hover:border-brand-accent/40 hover:bg-brand-accent/10"
      >
        <p className="text-sm font-bold tabular-nums text-brand-text">
          {call.ora}–{oraFineCall(call.ora, call.durataMinuti)}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-brand-text">{call.azienda}</p>
        <p className="mt-0.5 text-[11px] text-brand-muted">{durataCall(call.durataMinuti)} min</p>
        {(call.telefono || call.email) && (
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-brand-muted">
            {call.telefono && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {call.telefono}
              </span>
            )}
            {call.email && (
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" />
                {call.email}
              </span>
            )}
          </p>
        )}
        {call.attivita && <p className="mt-1 truncate text-xs text-brand-soft">{call.attivita}</p>}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/calendario?settimana=${settimanaPrec}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-soft hover:border-brand-accent/40 hover:text-brand-accent-light"
            aria-label="Settimana precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/dashboard/calendario?settimana=${settimanaSucc}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-soft hover:border-brand-accent/40 hover:text-brand-accent-light"
            aria-label="Settimana successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <p className="px-1 text-sm font-semibold text-brand-text">
            {formatGiornoCorto(lunedi)} – {formatGiornoCorto(addGiorni(lunedi, 6))}
          </p>
          {lunedi !== lunediOggi && (
            <Link
              href="/dashboard/calendario"
              className="rounded-full border border-brand-border-strong px-3 py-1 text-xs font-semibold text-brand-soft hover:border-brand-accent/40 hover:text-brand-accent-light"
            >
              Oggi
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => openNuova(selectedDay)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Nuova call
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {giorni.map((giorno, index) => {
          const isToday = giorno === oggi;
          const isSelected = giorno === selectedDay;
          const count = localCalls.filter((call) => call.giorno === giorno).length;
          return (
            <button
              key={giorno}
              type="button"
              onClick={() => setSelectedDay(giorno)}
              aria-label={`${GIORNI_SETT_BREVI[index]} ${Number(giorno.slice(8))}${
                count === 0 ? "" : count === 1 ? ", 1 call" : `, ${count} call`
              }`}
              className={`min-w-[3.5rem] flex-1 shrink-0 rounded-xl border px-2 py-2 text-center ${
                isSelected
                  ? "border-brand-accent/50 bg-brand-accent/15 text-brand-text"
                  : "border-brand-border bg-brand-elevated text-brand-soft"
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase">{GIORNI_SETT_BREVI[index]}</span>
              <span className={`block text-sm font-bold ${isToday ? "text-brand-accent-light" : ""}`}>
                {giorno.slice(8)}
              </span>
              <span className="mt-1 flex h-1.5 items-center justify-center" aria-hidden>
                {count > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold capitalize text-brand-text">{formatGiornoCompleto(selectedDay)}</p>
            <p className="text-xs text-brand-muted">
              {callsDelGiorno.length === 0
                ? "Nessuna call in questa giornata"
                : callsDelGiorno.length === 1
                  ? "1 call fissata"
                  : `${callsDelGiorno.length} call fissate`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNuova(selectedDay)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-border-strong px-3 py-1.5 text-xs font-semibold text-brand-soft hover:border-brand-accent/40 hover:text-brand-accent-light"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Aggiungi
          </button>
        </div>

        {callsDelGiorno.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-border px-4 py-8 text-center text-sm text-brand-muted">
            Qui vedi solo le call che hai fissato. Clicca Nuova call, scegli orario e durata.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {callsDelGiorno.map((call) => (
              <li key={call.id}>
                <CallCard call={call} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {draft && (
        <CallFormModal draft={draft} onClose={() => setDraft(null)} onSaved={applyResult} />
      )}
    </div>
  );
}
