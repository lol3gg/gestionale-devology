import { createClient } from "@/lib/supabase/server";
import { RichiesteTable, type RichiestaListItem } from "./_components/RichiesteTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: richieste, error } = await supabase
    .from("richieste")
    .select("id, nome, cognome, tipo_cliente, nome_azienda, budget, tempistiche, stato, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Richieste</h1>
        <p className="mt-1 text-sm text-gray-500">Tutte le richieste ricevute dal form pubblico.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Errore nel caricamento delle richieste: {error.message}
        </div>
      )}

      <RichiesteTable richieste={(richieste ?? []) as RichiestaListItem[]} />
    </div>
  );
}
