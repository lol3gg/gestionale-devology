"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";
import {
  CALL_DURATA_DEFAULT,
  GIORNI_SETT_BREVI,
  SLOT_ALTEZZA_PX,
  SLOT_FINE_MINUTI,
  SLOT_INIZIO_MINUTI,
  SLOT_ORE,
  SLOT_PASSO_MINUTI,
  addGiorni,
  arrotondaAlProssimoSlot,
  callCopreSlot,
  durataCall,
  formatGiornoCompleto,
  formatGiornoCorto,
  intervalliSiSovrappongono,
  isSlotPassato,
  lunediDellaSettimana,
  minutiCorrentiRoma,
  normalizzaOra,
  oraFineCall,
  oraToMinuti,
  slotSpanVisibile,
} from "@/lib/calendario/date";
import type { CallAppuntamento } from "@/lib/calendario/types";
import { CallFormModal, callToDraft, type CallFormDraft } from "./CallFormModal";

type CalendarioSettimanaProps = {
  lunedi: string;
  oggi: string;
  calls: CallAppuntamento[];
};

function slotKey(giorno: string, ora: string) {
  return `${giorno}|${normalizzaOra(ora)}`;
}

export function CalendarioSettimana({ lunedi, oggi, calls }: CalendarioSettimanaProps) {
  const giorni = useMemo(() => Array.from({ length: 7 }, (_, index) => addGiorni(lunedi, index)), [lunedi]);
  const [selectedDay, setSelectedDay] = useState(() => (giorni.includes(oggi) ? oggi : lunedi));
  const [draft, setDraft] = useState<CallFormDraft | null>(null);
  const [nowMinuti, setNowMinuti] = useState(minutiCorrentiRoma);

  useEffect(() => {
    setSelectedDay(giorni.includes(oggi) ? oggi : lunedi);
  }, [giorni, oggi, lunedi]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMinuti(minutiCorrentiRoma()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const occupancy = useMemo(() => {
    const map = new Map<string, CallAppuntamento>();
    for (const call of calls) {
      for (const ora of SLOT_ORE) {
        if (callCopreSlot(call.giorno, call.ora, call.durataMinuti, call.giorno, ora)) {
          map.set(slotKey(call.giorno, ora), call);
        }
      }
    }
    return map;
  }, [calls]);

  const settimanaPrec = addGiorni(lunedi, -7);
  const settimanaSucc = addGiorni(lunedi, 7);
  const lunediOggi = lunediDellaSettimana(oggi);
  const rowTemplate = { gridTemplateRows: `repeat(${SLOT_ORE.length}, ${SLOT_ALTEZZA_PX}px)` };

  function puoIniziare(giorno: string, ora: string, durataMinuti = CALL_DURATA_DEFAULT) {
    const start = oraToMinuti(ora);
    const durata = durataCall(durataMinuti);
    return !calls.some((call) => {
      if (call.giorno !== giorno) return false;
      return intervalliSiSovrappongono(start, durata, oraToMinuti(call.ora), durataCall(call.durataMinuti));
    });
  }

  function openNuova(giorno: string, ora: string) {
    setDraft({
      giorno,
      ora,
      durataMinuti: CALL_DURATA_DEFAULT,
      azienda: "",
      email: "",
      telefono: "",
      attivita: "",
    });
  }

  function openNuovaVeloce() {
    const dopoChiusura = nowMinuti > SLOT_FINE_MINUTI;
    const giorno = dopoChiusura
      ? addGiorni(oggi, 1)
      : giorni.includes(oggi)
        ? oggi
        : selectedDay;
    const partenza = giorno === oggi ? arrotondaAlProssimoSlot(nowMinuti) : "09:00";
    const startIndex = Math.max(0, SLOT_ORE.indexOf(partenza));
    const libero =
      SLOT_ORE.slice(startIndex).find((slot) => puoIniziare(giorno, slot)) ??
      SLOT_ORE.find((slot) => !occupancy.has(slotKey(giorno, slot)));
    openNuova(giorno, libero ?? SLOT_ORE[0]);
  }

  const lineTop =
    nowMinuti >= SLOT_INIZIO_MINUTI && nowMinuti <= SLOT_FINE_MINUTI + SLOT_PASSO_MINUTI
      ? ((nowMinuti - SLOT_INIZIO_MINUTI) / SLOT_PASSO_MINUTI) * SLOT_ALTEZZA_PX
      : null;

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
          onClick={openNuovaVeloce}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Nuova call
        </button>
      </div>

      {/* Mobile: selettore giorno + lista slot */}
      <div className="lg:hidden">
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
          {giorni.map((giorno, index) => {
            const isToday = giorno === oggi;
            const isSelected = giorno === selectedDay;
            const count = calls.filter((call) => call.giorno === giorno).length;
            return (
              <button
                key={giorno}
                type="button"
                onClick={() => setSelectedDay(giorno)}
                className={`min-w-[3.35rem] shrink-0 rounded-xl border px-2 py-2 text-center ${
                  isSelected
                    ? "border-brand-accent/50 bg-brand-accent/15 text-brand-text"
                    : "border-brand-border bg-brand-elevated text-brand-soft"
                }`}
              >
                <span className="block text-[10px] font-semibold uppercase">{GIORNI_SETT_BREVI[index]}</span>
                <span className={`block text-sm font-bold ${isToday ? "text-brand-accent-light" : ""}`}>
                  {giorno.slice(8)}
                </span>
                {count > 0 && (
                  <span className="mt-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-brand-accent" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mb-2 text-sm font-medium capitalize text-brand-muted">{formatGiornoCompleto(selectedDay)}</p>
        <ul className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
          {SLOT_ORE.map((ora) => {
            const occupying = occupancy.get(slotKey(selectedDay, ora));
            const isStart = occupying ? normalizzaOra(occupying.ora) === ora : false;
            if (occupying && !isStart) return null;
            const passato = isSlotPassato(selectedDay, ora, oggi, nowMinuti);
            return (
              <li key={ora} className="border-b border-brand-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => (occupying ? setDraft(callToDraft(occupying)) : openNuova(selectedDay, ora))}
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left ${
                    occupying ? "bg-brand-accent/10" : passato ? "opacity-55" : ""
                  }`}
                >
                  <span className="w-16 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-brand-muted">
                    {occupying ? `${ora}–${oraFineCall(occupying.ora, occupying.durataMinuti)}` : ora}
                  </span>
                  {occupying ? (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-brand-text">
                        {occupying.azienda}
                      </span>
                      <span className="mt-0.5 text-[11px] text-brand-muted">
                        {durataCall(occupying.durataMinuti)} min
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-brand-muted">
                        {occupying.telefono && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {occupying.telefono}
                          </span>
                        )}
                        {occupying.email && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {occupying.email}
                          </span>
                        )}
                      </span>
                      {occupying.attivita && (
                        <span className="mt-0.5 block truncate text-xs text-brand-soft">{occupying.attivita}</span>
                      )}
                    </span>
                  ) : (
                    <span className="pt-0.5 text-xs text-brand-muted">Libero — tocca per fissare</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop: griglia settimana */}
      <div className="hidden overflow-x-auto rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md lg:block">
        <div className="min-w-[920px]">
          <div className="sticky top-0 z-10 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-brand-border bg-brand-elevated">
            <div />
            {giorni.map((giorno, index) => {
              const isToday = giorno === oggi;
              const count = calls.filter((call) => call.giorno === giorno).length;
              return (
                <div
                  key={giorno}
                  className={`border-l border-brand-border px-2 py-2.5 text-center ${
                    isToday ? "bg-brand-accent/10" : ""
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    {GIORNI_SETT_BREVI[index]}
                  </p>
                  <p className={`text-sm font-bold ${isToday ? "text-brand-accent-light" : "text-brand-text"}`}>
                    {formatGiornoCorto(giorno)}
                  </p>
                  {count > 0 && (
                    <p className="text-[10px] text-brand-muted">
                      {count} call
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
            <div className="grid" style={rowTemplate}>
              {SLOT_ORE.map((ora) => (
                <div
                  key={ora}
                  className={`flex items-start justify-end border-b border-brand-border pr-2 pt-0.5 text-[10px] font-medium tabular-nums text-brand-muted ${
                    ora.endsWith(":00") ? "font-semibold text-brand-soft" : ""
                  }`}
                >
                  {ora}
                </div>
              ))}
            </div>

            {giorni.map((giorno) => {
              const isToday = giorno === oggi;
              return (
                <div key={giorno} className="relative grid border-l border-brand-border" style={rowTemplate}>
                  {isToday && lineTop != null && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-brand-accent"
                      style={{ top: lineTop }}
                    >
                      <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-accent" />
                    </div>
                  )}
                  {SLOT_ORE.map((ora, index) => {
                    const occupying = occupancy.get(slotKey(giorno, ora));
                    const isStart = occupying ? normalizzaOra(occupying.ora) === ora : false;
                    if (occupying && !isStart) return null;
                    const passato = isSlotPassato(giorno, ora, oggi, nowMinuti);
                    const span = occupying ? slotSpanVisibile(ora, occupying.durataMinuti) : 1;
                    return (
                      <button
                        key={ora}
                        type="button"
                        title={
                          occupying
                            ? `${ora}–${oraFineCall(occupying.ora, occupying.durataMinuti)} · ${occupying.azienda}`
                            : `${ora} libero`
                        }
                        onClick={() => (occupying ? setDraft(callToDraft(occupying)) : openNuova(giorno, ora))}
                        className={`z-10 block w-full overflow-hidden border-b border-brand-border px-1 py-0.5 text-left transition ${
                          occupying
                            ? "rounded-sm bg-brand-accent/25 hover:bg-brand-accent/35"
                            : passato
                              ? "bg-transparent hover:bg-brand-surface/80"
                              : "hover:bg-brand-accent/10"
                        } ${isToday && !occupying ? "bg-brand-accent/[0.04]" : ""}`}
                        style={{ gridRow: `${index + 1} / span ${span}` }}
                      >
                        {occupying ? (
                          <span className="block min-w-0">
                            <span className="block truncate text-[11px] font-bold leading-tight text-brand-text">
                              {occupying.azienda}
                            </span>
                            <span className="block truncate text-[10px] leading-tight text-brand-muted">
                              {ora}–{oraFineCall(occupying.ora, occupying.durataMinuti)}
                            </span>
                            {occupying.attivita && (
                              <span className="block truncate text-[10px] leading-tight text-brand-muted">
                                {occupying.attivita}
                              </span>
                            )}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {draft && <CallFormModal draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
