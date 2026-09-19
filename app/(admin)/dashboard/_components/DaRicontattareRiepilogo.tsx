import Link from "next/link";
import { Phone } from "lucide-react";
import { addGiorni, formatGiornoCorto, oggiIsoRoma } from "@/lib/calendario/date";
import { partiGiornoRelativo } from "@/lib/calendario/prossime";
import type { PreventivoRichiamoItem } from "@/lib/notifiche/preventiviRichiamo";

export const RIEPILOGO_RICHIAMI_MAX = 8;

function testoQuando(item: PreventivoRichiamoItem, oggi: string) {
  if (item.urgente) {
    if (item.giorniDaInvio === 7) return "Oggi · 1 settimana";
    const ritardo = item.giorniDaInvio - 7;
    return ritardo === 1 ? "In ritardo · 1 giorno" : `In ritardo · ${ritardo} giorni`;
  }
  if (item.data_richiamo === addGiorni(oggi, 1)) return "Domani";
  const manca = 7 - item.giorniDaInvio;
  return manca <= 0 ? formatGiornoCorto(item.data_richiamo) : `Tra ${manca} giorni`;
}

type DaRicontattareRiepilogoProps = {
  items: PreventivoRichiamoItem[];
};

export function DaRicontattareRiepilogo({ items }: DaRicontattareRiepilogoProps) {
  const oggi = oggiIsoRoma();
  const visibili = items.slice(0, RIEPILOGO_RICHIAMI_MAX);
  const nascoste = Math.max(0, items.length - visibili.length);
  const urgenti = items.filter((item) => item.urgente).length;
  const inArrivo = items.length - urgenti;

  return (
    <section className="overflow-hidden rounded-brand-lg border border-amber-400/30 bg-brand-elevated shadow-brand-md">
      <div className="flex items-center justify-between gap-3 border-b border-amber-400/20 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-text">Da ricontattare</p>
          <p className="text-xs text-brand-muted">
            {items.length === 0
              ? "Nessun richiamo: dopo 7 giorni dal preventivo compare qui"
              : [
                  urgenti === 0
                    ? "Nessuno in scadenza oggi"
                    : urgenti === 1
                      ? "1 da chiamare ora"
                      : `${urgenti} da chiamare ora`,
                  inArrivo > 0 ? `${inArrivo} in programma` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
        <Link
          href="/dashboard/preventivi"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/35 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:border-amber-300/60 hover:text-amber-100"
        >
          <Phone className="h-3.5 w-3.5" />
          Preventivi
        </Link>
      </div>

      {visibili.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-brand-muted sm:px-5">
          Quando un preventivo resta aperto 7 giorni, arriva anche la notifica alle 7:50.
        </p>
      ) : (
        <ul className="divide-y divide-brand-border">
          {visibili.map((item) => {
            const giorno =
              item.urgente && item.data_richiamo < oggi
                ? { titolo: "Scaduto", sotto: formatGiornoCorto(item.data_richiamo) }
                : partiGiornoRelativo(item.urgente ? oggi : item.data_richiamo, oggi);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 transition hover:bg-amber-500/5 sm:px-5 ${
                    item.urgente ? "bg-amber-500/10" : ""
                  }`}
                >
                  <span
                    className={`w-14 shrink-0 text-center ${
                      item.urgente ? "text-amber-200" : "text-brand-muted"
                    }`}
                  >
                    <span className="block text-[11px] font-semibold leading-tight">{giorno.titolo}</span>
                    {giorno.sotto && (
                      <span className="block text-[10px] leading-tight">{giorno.sotto}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-text">
                      {item.etichetta}
                    </span>
                    <span className="block truncate text-[11px] text-brand-muted">
                      Inviato {formatGiornoCorto(item.data_invio)} · {testoQuando(item, oggi)}
                      {item.telefono ? ` · ${item.telefono}` : ""}
                    </span>
                  </span>
                  {item.urgente ? (
                    <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-inset ring-amber-400/40">
                      Chiama
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand-muted ring-1 ring-inset ring-brand-border">
                      {formatGiornoCorto(item.data_richiamo)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {nascoste > 0 && (
        <div className="border-t border-brand-border px-4 py-2.5 sm:px-5">
          <Link
            href="/dashboard/preventivi"
            className="text-xs font-semibold text-brand-soft hover:text-amber-200"
          >
            Altri {nascoste} in Preventivi
          </Link>
        </div>
      )}
    </section>
  );
}
