import Link from "next/link";
import { CalendarDays, Phone } from "lucide-react";
import { durataCall, oraFineCall } from "@/lib/calendario/date";
import { RIEPILOGO_MAX, isCallInCorso, partiGiornoRelativo } from "@/lib/calendario/prossime";
import type { CallAppuntamento } from "@/lib/calendario/types";

type ProssimeCallRiepilogoProps = {
  calls: CallAppuntamento[];
  oggi: string;
  minutiOra: number;
};

export function ProssimeCallRiepilogo({ calls, oggi, minutiOra }: ProssimeCallRiepilogoProps) {
  const visibili = calls.slice(0, RIEPILOGO_MAX);
  const nascoste = Math.max(0, calls.length - visibili.length);
  const oggiCount = calls.filter((call) => call.giorno === oggi).length;
  const prossima = visibili[0] ?? null;

  return (
    <section className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
      <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-text">Prossime call</p>
          <p className="text-xs text-brand-muted">
            {calls.length === 0
              ? "Niente in programma nei prossimi giorni"
              : [
                  oggiCount === 0 ? "Nessuna oggi" : oggiCount === 1 ? "1 oggi" : `${oggiCount} oggi`,
                  calls.length === 1 ? "1 in totale" : `${calls.length} in programma`,
                ].join(" · ")}
          </p>
        </div>
        <Link
          href="/dashboard/calendario"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-border-strong px-3 py-1.5 text-xs font-semibold text-brand-soft hover:border-brand-accent/40 hover:text-brand-accent-light"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendario
        </Link>
      </div>

      {visibili.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-brand-muted sm:px-5">
          Nessuna call fissata. Apri il calendario per aggiungerne una.
        </p>
      ) : (
        <ul className="divide-y divide-brand-border">
          {visibili.map((call, index) => {
            const inCorso = isCallInCorso(call, oggi, minutiOra);
            const isNext = index === 0;
            const giorno = partiGiornoRelativo(call.giorno, oggi);
            return (
              <li key={call.id}>
                <Link
                  href="/dashboard/calendario"
                  className={`flex items-center gap-3 px-4 py-3 transition hover:bg-brand-accent/5 sm:px-5 ${
                    isNext ? "bg-brand-accent/10" : ""
                  }`}
                >
                  <span
                    className={`w-14 shrink-0 text-center ${
                      call.giorno === oggi ? "text-brand-accent-light" : "text-brand-muted"
                    }`}
                  >
                    <span className="block text-[11px] font-semibold leading-tight">{giorno.titolo}</span>
                    {giorno.sotto && (
                      <span className="block text-[10px] leading-tight">{giorno.sotto}</span>
                    )}
                  </span>
                  <span className="w-[5.75rem] shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-brand-text">
                    {call.ora}–{oraFineCall(call.ora, call.durataMinuti)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-text">
                      {call.azienda}
                    </span>
                    <span className="block truncate text-[11px] text-brand-muted">
                      {durataCall(call.durataMinuti)} min
                      {call.attivita ? ` · ${call.attivita}` : ""}
                    </span>
                  </span>
                  {inCorso ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/40">
                      In corso
                    </span>
                  ) : isNext ? (
                    <span className="shrink-0 rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-semibold text-brand-accent-light ring-1 ring-inset ring-brand-accent/35">
                      Prossima
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {prossima?.telefono && (
        <div className="border-t border-brand-border px-4 py-2.5 sm:px-5">
          <a
            href={`tel:${prossima.telefono.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent-light hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            Chiama {prossima.azienda} · {prossima.telefono}
          </a>
        </div>
      )}

      {nascoste > 0 && (
        <div className="border-t border-brand-border px-4 py-2.5 sm:px-5">
          <Link
            href="/dashboard/calendario"
            className="text-xs font-semibold text-brand-soft hover:text-brand-accent-light"
          >
            Altre {nascoste} nel calendario
          </Link>
        </div>
      )}
    </section>
  );
}
