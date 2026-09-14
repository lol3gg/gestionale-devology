import { CalendarDays, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  addGiorni,
  durataCall,
  isIsoDate,
  lunediDellaSettimana,
  minutiCorrentiRoma,
  oggiIsoRoma,
  oraToMinuti,
} from "@/lib/calendario/date";
import { listCalls } from "@/lib/calendario/store";
import { CalendarioSettimana } from "./_components/CalendarioSettimana";

export const dynamic = "force-dynamic";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: { settimana?: string };
}) {
  const oggi = oggiIsoRoma();
  const riferimento = isIsoDate(searchParams.settimana) ? searchParams.settimana : oggi;
  const lunedi = lunediDellaSettimana(riferimento);
  const domenica = addGiorni(lunedi, 6);

  const supabase = createClient();
  const oggiInSettimana = oggi >= lunedi && oggi <= domenica;
  const [weekResult, todayResult] = await Promise.all([
    listCalls(supabase, lunedi, domenica),
    oggiInSettimana ? Promise.resolve(null) : listCalls(supabase, oggi, oggi),
  ]);

  const error = weekResult.error ?? todayResult?.error ?? null;
  const calls = weekResult.calls;
  const oggiCalls = oggiInSettimana ? calls.filter((call) => call.giorno === oggi) : (todayResult?.calls ?? []);
  const oraAdesso = minutiCorrentiRoma();
  const prossima =
    oggiCalls.find((call) => oraToMinuti(call.ora) + durataCall(call.durataMinuti) > oraAdesso) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Pannello Admin
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          Calendario
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Fasce ogni 10 minuti, dalle 16:00 alle 19:30. Una call occupa 30 minuti e chiude gli slot dopo:
          se serve, in modifica puoi accorciare o allungare. Serve il nome dell&apos;azienda; email,
          cellulare e attività sono facoltativi.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5">
          <p className="text-2xl font-extrabold text-brand-text">{oggiCalls.length}</p>
          <p className="mt-0.5 text-xs text-brand-muted">Call oggi</p>
        </div>
        <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5">
          <p className="text-2xl font-extrabold text-brand-text">{calls.length}</p>
          <p className="mt-0.5 text-xs text-brand-muted">Call in settimana</p>
        </div>
        <div className="col-span-2 rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5 lg:col-span-1">
          {prossima ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-text">
                <Phone className="h-3.5 w-3.5 text-brand-accent-light" />
                {prossima.ora} · {prossima.azienda}
              </p>
              <p className="mt-0.5 text-xs text-brand-muted">Prossima call di oggi</p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-text">
                <CalendarDays className="h-3.5 w-3.5 text-brand-muted" />
                {oggiCalls.length > 0 ? "Nessuna altra call oggi" : "Nessuna call oggi"}
              </p>
              <p className="mt-0.5 text-xs text-brand-muted">Clicca uno slot libero per fissarne una</p>
            </>
          )}
        </div>
      </div>

      <CalendarioSettimana lunedi={lunedi} oggi={oggi} calls={calls} />
    </div>
  );
}
