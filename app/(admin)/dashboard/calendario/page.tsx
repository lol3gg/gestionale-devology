import { CalendarDays, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  addGiorni,
  isIsoDate,
  lunediDellaSettimana,
  minutiCorrentiRoma,
  oggiIsoRoma,
  oraToMinuti,
  normalizzaOra,
  SLOT_DURATA_MINUTI,
} from "@/lib/calendario/date";
import type { CallAppuntamento } from "@/lib/calendario/types";
import { CalendarioSettimana } from "./_components/CalendarioSettimana";
import { SetupCalendarioNotice } from "./_components/SetupCalendarioNotice";

export const dynamic = "force-dynamic";

function isMissingTable(message: string | undefined) {
  if (!message) return false;
  return /schema cache|does not exist|call_appuntamenti/i.test(message);
}

function mapCall(row: {
  id: string;
  giorno: string;
  ora: string;
  azienda: string;
  email: string | null;
  telefono: string | null;
  attivita: string | null;
}): CallAppuntamento {
  return {
    id: row.id,
    giorno: row.giorno,
    ora: normalizzaOra(row.ora),
    azienda: row.azienda,
    email: row.email,
    telefono: row.telefono,
    attivita: row.attivita,
  };
}

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
  const [{ data: weekRows, error: weekError }, { data: todayRows, error: todayError }] = await Promise.all([
    supabase
      .from("call_appuntamenti")
      .select("id, giorno, ora, azienda, email, telefono, attivita")
      .gte("giorno", lunedi)
      .lte("giorno", domenica)
      .order("giorno", { ascending: true })
      .order("ora", { ascending: true }),
    supabase
      .from("call_appuntamenti")
      .select("id, giorno, ora, azienda, email, telefono, attivita")
      .eq("giorno", oggi)
      .order("ora", { ascending: true }),
  ]);

  const error = weekError ?? todayError;
  const missingTables = isMissingTable(weekError?.message) || isMissingTable(todayError?.message);

  const calls = (weekRows ?? []).map(mapCall);
  const oggiCalls = (todayRows ?? []).map(mapCall);
  const oraAdesso = minutiCorrentiRoma();
  const prossima =
    oggiCalls.find((call) => oraToMinuti(call.ora) + SLOT_DURATA_MINUTI > oraAdesso) ?? null;

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
          Fissa le call ogni 30 minuti: serve il nome dell&apos;azienda. Email, cellulare e cosa fanno sono
          facoltativi.
        </p>
      </div>

      {error &&
        (missingTables ? (
          <SetupCalendarioNotice />
        ) : (
          <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
            Errore nel caricamento: {error.message}
          </div>
        ))}

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
