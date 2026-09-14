import { createClient } from "@/lib/supabase/server";
import {
  contaMesiNelPeriodo,
  getPeriodoLabel,
  getRangePeriodoContabilita,
  normalizzaPeriodoContabilita,
} from "@/lib/contabilita/format";
import { listCanoni, totaleCanoniNelPeriodo } from "@/lib/contabilita/canoni";
import { RiepilogoCards } from "./_components/RiepilogoCards";
import { SelettorePeriodo } from "./_components/SelettorePeriodo";
import { EsportaCsvButton } from "./_components/EsportaCsvButton";
import { MovimentiTable, type MovimentoItem } from "./_components/MovimentiTable";
import { NuovoMovimentoForm } from "./_components/NuovoMovimentoForm";
import { AbbonamentiManager, type AbbonamentoItem } from "./_components/AbbonamentiManager";
import { NuovoAbbonamentoForm } from "./_components/NuovoAbbonamentoForm";
import { NuovoCanoneForm } from "./_components/NuovoCanoneForm";
import { CanoniManager } from "./_components/CanoniManager";
import { PanoramicaAnno } from "./_components/PanoramicaAnno";

export const dynamic = "force-dynamic";

type ContabilitaPageProps = {
  searchParams: { tipo?: string; mese?: string; da?: string; a?: string };
};

type RichiestaRef = { id: string; nome: string; cognome: string } | null;

export default async function ContabilitaPage({ searchParams }: ContabilitaPageProps) {
  const supabase = createClient();
  const periodo = normalizzaPeriodoContabilita(searchParams);
  const { inizio, fine } = getRangePeriodoContabilita(periodo);
  const anno = new Date().getFullYear();
  const inizioAnno = `${anno}-01-01`;
  const fineAnno = `${anno + 1}-01-01`;

  const [
    { data: movimentiRows, error: movimentiError },
    { data: movimentiAnnoRows },
    { data: abbonamentiRows, error: abbonamentiError },
    { data: richiesteRows },
  ] = await Promise.all([
    supabase
      .from("movimenti")
      .select("id, tipo, categoria, descrizione, importo, data, note, richieste(id, nome, cognome)")
      .gte("data", inizio)
      .lt("data", fine)
      .order("data", { ascending: false }),
    supabase.from("movimenti").select("tipo, importo, data").gte("data", inizioAnno).lt("data", fineAnno),
    supabase
      .from("abbonamenti")
      .select("id, nome, costo_mensile, categoria, attivo, data_inizio")
      .order("attivo", { ascending: false })
      .order("nome", { ascending: true }),
    supabase.from("richieste").select("id, nome, cognome").order("created_at", { ascending: false }),
  ]);

  let canoni: Awaited<ReturnType<typeof listCanoni>> = [];
  let canoniError: string | null = null;
  try {
    canoni = await listCanoni(supabase);
  } catch (error) {
    canoniError = error instanceof Error ? error.message : "Errore nei canoni.";
  }

  const movimenti: MovimentoItem[] = (movimentiRows ?? []).map((movimento) => ({
    ...movimento,
    richiesta: (Array.isArray(movimento.richieste) ? movimento.richieste[0] : movimento.richieste) as RichiestaRef,
  }));

  const abbonamenti: AbbonamentoItem[] = abbonamentiRows ?? [];
  const richieste = richiesteRows ?? [];
  const movimentiNelPeriodo = movimenti.length;
  const { count: movimentiTotaliCount } = await supabase
    .from("movimenti")
    .select("id", { count: "exact", head: true });

  const entrateMovimenti = movimenti
    .filter((movimento) => movimento.tipo === "entrata")
    .reduce((sum, movimento) => sum + Number(movimento.importo), 0);

  const usciteMovimentiTotali = movimenti
    .filter((movimento) => movimento.tipo === "uscita")
    .reduce((sum, movimento) => sum + Number(movimento.importo), 0);

  const abbonamentiTotaleMensile = abbonamenti
    .filter((abbonamento) => abbonamento.attivo)
    .reduce((sum, abbonamento) => sum + Number(abbonamento.costo_mensile), 0);

  const abbonamentiCostoPeriodo = abbonamenti
    .filter((abbonamento) => abbonamento.attivo)
    .reduce(
      (sum, abbonamento) =>
        sum + Number(abbonamento.costo_mensile) * contaMesiNelPeriodo(abbonamento.data_inizio, inizio, fine),
      0
    );

  const canoniPeriodo = totaleCanoniNelPeriodo(canoni, inizio, fine);
  const entrateTotali = entrateMovimenti + canoniPeriodo;
  const usciteTotali = usciteMovimentiTotali + abbonamentiCostoPeriodo;
  const saldoNetto = entrateTotali - usciteTotali;

  const entrateUnaTantumAnno = (movimentiAnnoRows ?? [])
    .filter((row) => row.tipo === "entrata")
    .reduce((sum, row) => sum + Number(row.importo), 0);
  const usciteUnaTantumAnno = (movimentiAnnoRows ?? [])
    .filter((row) => row.tipo === "uscita")
    .reduce((sum, row) => sum + Number(row.importo), 0);
  const canoniAnno = totaleCanoniNelPeriodo(canoni, inizioAnno, fineAnno);
  const abbonamentiAnno = abbonamenti
    .filter((abbonamento) => abbonamento.attivo)
    .reduce(
      (sum, abbonamento) =>
        sum + Number(abbonamento.costo_mensile) * contaMesiNelPeriodo(abbonamento.data_inizio, inizioAnno, fineAnno),
      0
    );

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
            Entrate, uscite, canoni assistenza e abbonamenti — {getPeriodoLabel(periodo)}.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <SelettorePeriodo periodo={periodo} />
          <EsportaCsvButton
            periodo={periodo}
            movimenti={movimenti}
            totals={{
              entrateTotali,
              usciteTotali,
              saldoNetto,
              abbonamentiTotaleMensile,
            }}
          />
        </div>
      </div>

      {(movimentiError || abbonamentiError || canoniError) && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento dei dati: {movimentiError?.message ?? abbonamentiError?.message ?? canoniError}
        </div>
      )}

      <PanoramicaAnno
        anno={anno}
        entrateUnaTantum={entrateUnaTantumAnno}
        canoniAnno={canoniAnno}
        usciteUnaTantum={usciteUnaTantumAnno}
        abbonamentiAnno={abbonamentiAnno}
      />

      <RiepilogoCards
        entrateTotali={entrateTotali}
        usciteTotali={usciteTotali}
        saldoNetto={saldoNetto}
        abbonamentiTotale={abbonamentiTotaleMensile}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-brand-text">Movimenti</h2>
        <NuovoMovimentoForm richieste={richieste} />
        <MovimentiTable
          movimenti={movimenti}
          altriMesi={movimentiNelPeriodo === 0 && (movimentiTotaliCount ?? 0) > 0}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-brand-text">Canoni clienti (assistenza)</h2>
        <p className="text-sm text-brand-muted">
          Quota o percentuale mensile che un cliente ti paga per tenere il sistema attivo.
          Resta salvata e entra nella stima di fine anno.
        </p>
        <NuovoCanoneForm />
        <CanoniManager canoni={canoni} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-brand-text">Abbonamenti attivi (costi)</h2>
        <NuovoAbbonamentoForm />
        <AbbonamentiManager abbonamenti={abbonamenti} />
      </section>
    </div>
  );
}
