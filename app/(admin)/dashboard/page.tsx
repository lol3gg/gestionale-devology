import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  RICHIESTE_PER_PAGINA,
  buildDashboardHref,
  escapeIlike,
  parseDashboardQuery,
} from "@/lib/richieste/dashboardQuery";
import { STATO_OPTIONS, type StatoRichiesta } from "@/lib/richieste/stato";
import { DashboardOverview } from "./_components/DashboardOverview";
import { EliminataToast } from "./_components/EliminataToast";
import type { RichiestaListItem } from "./_components/RichiesteTable";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: {
    pagina?: string;
    q?: string;
    stato?: string;
    tipo?: string;
    eliminata?: string;
  };
};

/** Stati mostrati nella lista "Richieste" (l'archivio ha una sezione dedicata). */
const STATI_ATTIVI = STATO_OPTIONS.filter((option) => option.value !== "archiviato");

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();
  const { pagina, q, stato, tipo } = parseDashboardQuery(searchParams);

  // Le archiviate vivono in /dashboard/archivio, non qui.
  if (stato === "archiviato") {
    redirect("/dashboard/archivio");
  }

  // Conteggi globali per le card KPI (solo richieste non archiviate).
  const kpiQueries = await Promise.all([
    supabase
      .from("richieste")
      .select("id", { count: "exact", head: true })
      .neq("stato", "archiviato"),
    ...STATI_ATTIVI.map((option) =>
      supabase
        .from("richieste")
        .select("id", { count: "exact", head: true })
        .eq("stato", option.value)
    ),
  ]);

  const totaleGlobale = kpiQueries[0].count ?? 0;
  const conteggiPerStato: Partial<Record<StatoRichiesta, number>> = {};
  STATI_ATTIVI.forEach((option, index) => {
    conteggiPerStato[option.value] = kpiQueries[index + 1].count ?? 0;
  });

  // Lista paginata + count exact dei soli risultati filtrati (senza archiviate).
  let listQuery = supabase
    .from("richieste")
    .select(
      "id, nome, cognome, tipo_cliente, nome_azienda, budget, tempistiche, tipo_progetto, stato, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (stato) {
    listQuery = listQuery.eq("stato", stato);
  } else {
    listQuery = listQuery.neq("stato", "archiviato");
  }
  if (tipo) listQuery = listQuery.eq("tipo_progetto", tipo);
  if (q) {
    const pattern = `"%${escapeIlike(q)}%"`;
    listQuery = listQuery.or(
      `nome.ilike.${pattern},cognome.ilike.${pattern},nome_azienda.ilike.${pattern}`
    );
  }

  const from = (pagina - 1) * RICHIESTE_PER_PAGINA;
  const to = from + RICHIESTE_PER_PAGINA - 1;

  const { data: richieste, error, count } = await listQuery.range(from, to);

  const totaleFiltrato = count ?? 0;
  const totalePagine = Math.max(1, Math.ceil(totaleFiltrato / RICHIESTE_PER_PAGINA));

  // Se l'URL punta a una pagina oltre l'ultima (es. dopo un filtro), torna all'ultima utile.
  if (totaleFiltrato > 0 && pagina > totalePagine) {
    redirect(buildDashboardHref({ pagina: totalePagine, q, stato, tipo }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Pannello Admin
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          Richieste
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Richieste attive dal form pubblico. Quelle archiviate sono nella sezione{" "}
          <a href="/dashboard/archivio" className="font-semibold text-brand-accent-light hover:underline">
            Archivio
          </a>
          .
        </p>
      </div>

      <Suspense fallback={null}>
        <EliminataToast />
      </Suspense>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento delle richieste: {error.message}
        </div>
      )}

      <DashboardOverview
        richieste={(richieste ?? []) as RichiestaListItem[]}
        totaleFiltrato={totaleFiltrato}
        pagina={pagina}
        totalePagine={totalePagine}
        q={q}
        stato={stato}
        tipo={tipo}
        conteggiPerStato={conteggiPerStato}
        totaleGlobale={totaleGlobale}
      />
    </div>
  );
}
