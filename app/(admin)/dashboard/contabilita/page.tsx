import { createClient } from "@/lib/supabase/server";
import {
  contaMesiNelPeriodo,
  getPeriodoLabel,
  getRangePeriodoContabilita,
  normalizzaPeriodoContabilita,
} from "@/lib/contabilita/format";
import { RiepilogoCards } from "./_components/RiepilogoCards";
import { SelettorePeriodo } from "./_components/SelettorePeriodo";
import { MovimentiTable, type MovimentoItem } from "./_components/MovimentiTable";
import { NuovoMovimentoForm } from "./_components/NuovoMovimentoForm";
import { AbbonamentiManager, type AbbonamentoItem } from "./_components/AbbonamentiManager";
import { NuovoAbbonamentoForm } from "./_components/NuovoAbbonamentoForm";

export const dynamic = "force-dynamic";

type ContabilitaPageProps = {
  searchParams: { tipo?: string; mese?: string; da?: string; a?: string };
};

type RichiestaRef = { id: string; nome: string; cognome: string } | null;

export default async function ContabilitaPage({ searchParams }: ContabilitaPageProps) {
  const supabase = createClient();
  const periodo = normalizzaPeriodoContabilita(searchParams);
  const { inizio, fine } = getRangePeriodoContabilita(periodo);

  const [{ data: movimentiRows, error: movimentiError }, { data: abbonamentiRows, error: abbonamentiError }, { data: richiesteRows }] =
    await Promise.all([
      supabase
        .from("movimenti")
        .select(
          "id, tipo, categoria, descrizione, importo, data, note, richieste(id, nome, cognome)"
        )
        .gte("data", inizio)
        .lt("data", fine)
        .order("data", { ascending: false }),
      supabase
        .from("abbonamenti")
        .select("id, nome, costo_mensile, categoria, attivo, data_inizio")
        .order("attivo", { ascending: false })
        .order("nome", { ascending: true }),
      supabase.from("richieste").select("id, nome, cognome").order("created_at", { ascending: false }),
    ]);

  const movimenti: MovimentoItem[] = (movimentiRows ?? []).map((movimento) => ({
    ...movimento,
    richiesta: (Array.isArray(movimento.richieste) ? movimento.richieste[0] : movimento.richieste) as RichiestaRef,
  }));

  const abbonamenti: AbbonamentoItem[] = abbonamentiRows ?? [];
  const richieste = richiesteRows ?? [];

  const entrateTotali = movimenti
    .filter((movimento) => movimento.tipo === "entrata")
    .reduce((sum, movimento) => sum + Number(movimento.importo), 0);

  const usciteMovimentiTotali = movimenti
    .filter((movimento) => movimento.tipo === "uscita")
    .reduce((sum, movimento) => sum + Number(movimento.importo), 0);

  // Costo mensile ricorrente "a oggi" (mostrato nella card come riferimento, indipendente dal periodo).
  const abbonamentiTotaleMensile = abbonamenti
    .filter((abbonamento) => abbonamento.attivo)
    .reduce((sum, abbonamento) => sum + Number(abbonamento.costo_mensile), 0);

  // Quota abbonamenti effettivamente imputabile al periodo selezionato: ogni abbonamento attivo
  // contribuisce per ogni mese calendariale coperto dal periodo (dalla sua data di inizio in poi),
  // cosi' un periodo di 12 mesi include 12 quote, un anno da inizio anno ne include quante ne sono
  // trascorse, un mese singolo ne include una sola, ecc.
  const abbonamentiCostoPeriodo = abbonamenti
    .filter((abbonamento) => abbonamento.attivo)
    .reduce(
      (sum, abbonamento) =>
        sum + Number(abbonamento.costo_mensile) * contaMesiNelPeriodo(abbonamento.data_inizio, inizio, fine),
      0
    );

  const usciteTotali = usciteMovimentiTotali + abbonamentiCostoPeriodo;
  const saldoNetto = entrateTotali - usciteTotali;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
            Pannello Admin
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
            Contabilità
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Entrate, uscite e abbonamenti ricorrenti — {getPeriodoLabel(periodo)}.
          </p>
        </div>
        <SelettorePeriodo periodo={periodo} />
      </div>

      {(movimentiError || abbonamentiError) && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento dei dati: {movimentiError?.message ?? abbonamentiError?.message}
        </div>
      )}

      <RiepilogoCards
        entrateTotali={entrateTotali}
        usciteTotali={usciteTotali}
        saldoNetto={saldoNetto}
        abbonamentiTotale={abbonamentiTotaleMensile}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-brand-text">Movimenti</h2>
        <NuovoMovimentoForm richieste={richieste} />
        <MovimentiTable movimenti={movimenti} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-brand-text">Abbonamenti attivi</h2>
        <NuovoAbbonamentoForm />
        <AbbonamentiManager abbonamenti={abbonamenti} />
      </section>
    </div>
  );
}
