import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RICHIESTE_PER_PAGINA, escapeIlike } from "@/lib/richieste/dashboardQuery";
import { TIPO_PROGETTO_OPTIONS } from "@/lib/richieste/progetto";
import { ArchiviataToast } from "../_components/ArchiviataToast";
import { ArchivioOverview } from "../_components/ArchivioOverview";
import type { RichiestaListItem } from "../_components/RichiesteTable";

export const dynamic = "force-dynamic";

type ArchivioPageProps = {
  searchParams: {
    pagina?: string;
    q?: string;
    tipo?: string;
    archiviata?: string;
  };
};

function buildArchivioHref(params: { pagina?: number; q?: string; tipo?: string }) {
  const search = new URLSearchParams();
  if (params.pagina && params.pagina > 1) search.set("pagina", String(params.pagina));
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.tipo) search.set("tipo", params.tipo);
  const qs = search.toString();
  return qs ? `/dashboard/archivio?${qs}` : "/dashboard/archivio";
}

export default async function ArchivioPage({ searchParams }: ArchivioPageProps) {
  const supabase = createClient();

  const paginaRaw = Number.parseInt(searchParams.pagina ?? "1", 10);
  const pagina = Number.isFinite(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;
  const q = (searchParams.q ?? "").trim();
  const tipoCandidate = searchParams.tipo ?? "";
  const tipo = (TIPO_PROGETTO_OPTIONS as readonly string[]).includes(tipoCandidate)
    ? tipoCandidate
    : "";

  let listQuery = supabase
    .from("richieste")
    .select(
      "id, nome, cognome, tipo_cliente, nome_azienda, budget, tempistiche, tipo_progetto, stato, created_at",
      { count: "exact" }
    )
    .eq("stato", "archiviato")
    .order("created_at", { ascending: false });

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

  if (totaleFiltrato > 0 && pagina > totalePagine) {
    redirect(buildArchivioHref({ pagina: totalePagine, q, tipo }));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-brand-lg border border-brand-border bg-brand-elevated/80 p-5 shadow-brand-md sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-soft ring-1 ring-inset ring-white/10">
            <Archive className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
              Pannello Admin
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
              Archivio cliente
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-muted">
              Qui trovi le richieste archiviate: non sono eliminate, restano consultabili. Puoi
              riaprirle cambiando lo stato dal dettaglio, oppure eliminarle definitivamente se non
              ti servono più.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ArchiviataToast />
      </Suspense>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento dell&apos;archivio: {error.message}
        </div>
      )}

      <ArchivioOverview
        richieste={(richieste ?? []) as RichiestaListItem[]}
        totaleFiltrato={totaleFiltrato}
        pagina={pagina}
        totalePagine={totalePagine}
        q={q}
        tipo={tipo}
      />
    </div>
  );
}
