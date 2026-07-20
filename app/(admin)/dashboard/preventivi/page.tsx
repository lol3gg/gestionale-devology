import { createClient } from "@/lib/supabase/server";
import { regenerateSignedUrl } from "@/lib/storage/signedUrl";
import { NuovoPreventivoForm } from "./_components/NuovoPreventivoForm";
import { PreventiviLista, type PreventivoListaItem } from "./_components/PreventiviLista";

export const dynamic = "force-dynamic";

const PREVENTIVI_BUCKET = "preventivi-clienti";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4; // 4 ore

type RichiestaRef = { id: string; nome: string; cognome: string } | null;

export default async function PreventiviPage() {
  const supabase = createClient();

  const { data: preventiviRows, error } = await supabase
    .from("preventivi")
    .select(
      "id, numero_preventivo, data_invio, nome_file, url_file, nome, cognome, azienda, prezzo, stato, created_at, richieste(id, nome, cognome)"
    )
    .order("data_invio", { ascending: false });

  const preventivi: PreventivoListaItem[] = await Promise.all(
    (preventiviRows ?? []).map(async (preventivo) => ({
      id: preventivo.id,
      numero_preventivo: preventivo.numero_preventivo,
      data_invio: preventivo.data_invio,
      nome_file: preventivo.nome_file,
      url_file: preventivo.url_file,
      nome: preventivo.nome,
      cognome: preventivo.cognome,
      azienda: preventivo.azienda,
      prezzo: preventivo.prezzo != null ? Number(preventivo.prezzo) : null,
      stato: preventivo.stato ?? "inviato",
      richiesta: (Array.isArray(preventivo.richieste)
        ? preventivo.richieste[0]
        : preventivo.richieste) as RichiestaRef,
      downloadUrl: await regenerateSignedUrl(
        supabase,
        PREVENTIVI_BUCKET,
        preventivo.url_file,
        SIGNED_URL_EXPIRY_SECONDS
      ),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Pannello Admin
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          Preventivi
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Totale preventivato, filtra attivi/non attivi e crea nuovi preventivi.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento dei preventivi: {error.message}
        </div>
      )}

      <NuovoPreventivoForm />
      <PreventiviLista preventiviIniziali={preventivi} />
    </div>
  );
}
