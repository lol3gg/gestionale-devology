import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatoSelect } from "../_components/StatoSelect";
import { NoteInterneForm } from "../_components/NoteInterneForm";

export const dynamic = "force-dynamic";

const BUCKET = "allegati-clienti";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4; // 4 ore

/**
 * "url_file" salva il signed URL generato al momento dell'upload (vedi
 * app/(public)/richiedi/page.tsx). Da quel signed URL estraiamo il percorso
 * dell'oggetto nel bucket per poterne rigenerare uno nuovo, a validità breve,
 * ogni volta che la richiesta viene visualizzata in dashboard.
 */
function extractStoragePath(signedUrl: string): string | null {
  const marker = `/object/sign/${BUCKET}/`;
  const markerIndex = signedUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const path = signedUrl.slice(markerIndex + marker.length).split("?")[0];

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{value}</dd>
    </div>
  );
}

type RichiestaDetailPageProps = {
  params: { id: string };
};

export default async function RichiestaDetailPage({ params }: RichiestaDetailPageProps) {
  const supabase = createClient();

  const { data: richiesta, error } = await supabase
    .from("richieste")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !richiesta) {
    notFound();
  }

  const { data: allegatiRows } = await supabase
    .from("allegati")
    .select("id, nome_file, url_file, created_at")
    .eq("richiesta_id", params.id)
    .order("created_at", { ascending: true });

  const allegati = await Promise.all(
    (allegatiRows ?? []).map(async (allegato) => {
      const path = extractStoragePath(allegato.url_file);
      if (!path) {
        return { ...allegato, downloadUrl: allegato.url_file as string | null };
      }

      const { data: signedUrlData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

      return { ...allegato, downloadUrl: signedUrlData?.signedUrl ?? allegato.url_file };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← Torna alla dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {richiesta.nome} {richiesta.cognome}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{richiesta.email}</p>
        </div>
        <StatoSelect richiestaId={richiesta.id} statoIniziale={richiesta.stato} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Dettagli richiesta</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Email" value={richiesta.email} />
              <DetailItem label="Telefono" value={richiesta.telefono ?? "—"} />
              <DetailItem
                label="Tipo cliente"
                value={richiesta.tipo_cliente === "azienda" ? "Azienda" : "Privato"}
              />
              {richiesta.tipo_cliente === "azienda" && (
                <>
                  <DetailItem label="Nome azienda" value={richiesta.nome_azienda ?? "—"} />
                  <DetailItem label="Partita IVA" value={richiesta.partita_iva ?? "—"} />
                </>
              )}
              <DetailItem label="Budget indicativo" value={richiesta.budget ?? "—"} />
              <DetailItem label="Tempistiche desiderate" value={richiesta.tempistiche ?? "—"} />
              <DetailItem label="Come ci ha conosciuto" value={richiesta.come_conosciuto ?? "—"} />
              <DetailItem
                label="Data richiesta"
                value={new Date(richiesta.created_at).toLocaleString("it-IT")}
              />
            </dl>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700">Descrizione progetto</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                {richiesta.descrizione_progetto}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Allegati</h2>
            {allegati.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Nessun allegato caricato.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {allegati.map((allegato) => (
                  <li key={allegato.id} className="flex items-center justify-between gap-3 py-3">
                    <p className="min-w-0 truncate text-sm font-medium text-gray-800">
                      {allegato.nome_file}
                    </p>
                    {allegato.downloadUrl ? (
                      <a
                        href={allegato.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Scarica
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-red-500">Link non disponibile</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <NoteInterneForm richiestaId={richiesta.id} noteIniziali={richiesta.note_interne ?? ""} />
        </div>
      </div>
    </div>
  );
}
