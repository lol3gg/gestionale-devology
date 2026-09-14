import { createClient } from "@/lib/supabase/server";
import { regenerateSignedUrl } from "@/lib/storage/signedUrl";
import { NuovoPreventivoForm } from "./_components/NuovoPreventivoForm";
import { PreventiviLista, type PreventivoListaItem } from "./_components/PreventiviLista";
import type { CollaboratoreOption } from "@/lib/collaboratori/types";

export const dynamic = "force-dynamic";

const PREVENTIVI_BUCKET = "preventivi-clienti";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4; // 4 ore

type RichiestaRef = { id: string; nome: string; cognome: string } | null;

export default async function PreventiviPage() {
  const supabase = createClient();

  const [{ data: preventiviRows, error }, { data: collaboratoriRows }, { data: lavoriRows }] = await Promise.all([
    supabase
      .from("preventivi")
      .select(
        "id, numero_preventivo, data_invio, nome_file, url_file, nome, cognome, azienda, prezzo, stato, created_at, richieste(id, nome, cognome)"
      )
      .order("data_invio", { ascending: false }),
    supabase.from("collaboratori").select("id, nome, percentuale, attivo").eq("attivo", true).order("nome"),
    supabase.from("collaboratore_lavori").select("id, preventivo_id, collaboratore_id, percentuale"),
  ]);

  const collaboratori: CollaboratoreOption[] = (collaboratoriRows ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    percentuale: Number(row.percentuale),
    attivo: row.attivo,
  }));

  const lavoroPerPreventivo = new Map(
    (lavoriRows ?? [])
      .filter((row) => row.preventivo_id)
      .map((row) => [row.preventivo_id as string, row])
  );

  const preventivi: PreventivoListaItem[] = await Promise.all(
    (preventiviRows ?? []).map(async (preventivo) => {
      const lavoro = lavoroPerPreventivo.get(preventivo.id);
      const collaboratore = lavoro
        ? collaboratori.find((item) => item.id === lavoro.collaboratore_id)
        : null;

      return {
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
        collaboratoreId: lavoro?.collaboratore_id ?? null,
        percentualeCollaboratore: lavoro ? Number(lavoro.percentuale) : null,
        collaboratoreNome: collaboratore?.nome ?? null,
        richiesta: (Array.isArray(preventivo.richieste)
          ? preventivo.richieste[0]
          : preventivo.richieste) as RichiestaRef,
        downloadUrl: await regenerateSignedUrl(
          supabase,
          PREVENTIVI_BUCKET,
          preventivo.url_file,
          SIGNED_URL_EXPIRY_SECONDS
        ),
      };
    })
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
          Se un collaboratore chiude un progetto da 5.000 € e la sua % è 20, gli spettano 1.000 €.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento dei preventivi: {error.message}
        </div>
      )}

      <NuovoPreventivoForm collaboratori={collaboratori} />
      <PreventiviLista preventiviIniziali={preventivi} collaboratori={collaboratori} />
    </div>
  );
}
