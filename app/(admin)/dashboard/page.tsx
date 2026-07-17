import { createClient } from "@/lib/supabase/server";
import { DashboardOverview } from "./_components/DashboardOverview";
import type { RichiestaListItem } from "./_components/RichiesteTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: richieste, error } = await supabase
    .from("richieste")
    .select(
      "id, nome, cognome, tipo_cliente, nome_azienda, budget, tempistiche, tipo_progetto, stato, created_at"
    )
    .order("created_at", { ascending: false });

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
          Tutte le richieste ricevute dal form pubblico, in ordine cronologico.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento delle richieste: {error.message}
        </div>
      )}

      <DashboardOverview richieste={(richieste ?? []) as RichiestaListItem[]} />
    </div>
  );
}
