import Link from "next/link";
import { Download, FileText, SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { regenerateSignedUrl } from "@/lib/storage/signedUrl";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";

export const dynamic = "force-dynamic";

const PREVENTIVI_BUCKET = "preventivi-clienti";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4; // 4 ore

function formatDataInvio(value: string) {
  return new Date(value).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

type RichiestaRef = { id: string; nome: string; cognome: string } | null;

export default async function PreventiviPage() {
  const supabase = createClient();

  const { data: preventiviRows, error } = await supabase
    .from("preventivi")
    .select("id, numero_preventivo, data_invio, nome_file, url_file, created_at, richieste(id, nome, cognome)")
    .order("data_invio", { ascending: false });

  const preventivi = await Promise.all(
    (preventiviRows ?? []).map(async (preventivo) => ({
      ...preventivo,
      richiesta: (Array.isArray(preventivo.richieste) ? preventivo.richieste[0] : preventivo.richieste) as RichiestaRef,
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
          Tutti i preventivi caricati, collegati alle rispettive richieste.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
          Errore nel caricamento dei preventivi: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border">
            <thead className="bg-brand-surface/60">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Numero preventivo
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Cliente
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Data invio
                </th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {preventivi.length > 0 ? (
                preventivi.map((preventivo) => {
                  const richiesta = preventivo.richiesta;
                  const nomeCompleto = richiesta ? `${richiesta.nome} ${richiesta.cognome}`.trim() : "—";
                  const avatarClasses = getAvatarClasses(richiesta?.id ?? preventivo.id);

                  return (
                    <tr key={preventivo.id} className="group transition-colors hover:bg-brand-accent/5">
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Link
                          href={richiesta ? `/dashboard/${richiesta.id}` : "#"}
                          className="flex items-center gap-2 text-sm font-semibold text-brand-text"
                        >
                          <FileText className="h-4 w-4 text-brand-accent-light" />
                          {preventivo.numero_preventivo}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Link
                          href={richiesta ? `/dashboard/${richiesta.id}` : "#"}
                          className="flex items-center gap-3"
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${avatarClasses}`}
                          >
                            {richiesta ? getInitials(richiesta.nome, richiesta.cognome) : "?"}
                          </span>
                          <span className="text-sm text-brand-soft">{nomeCompleto}</span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-brand-muted">
                        <Link href={richiesta ? `/dashboard/${richiesta.id}` : "#"} className="block">
                          {formatDataInvio(preventivo.data_invio)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        {preventivo.downloadUrl ? (
                          <a
                            href={preventivo.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Scarica ${preventivo.numero_preventivo}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-brand-accent-light">N/D</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
                        <SearchX className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-medium text-brand-soft">Nessun preventivo caricato.</p>
                      <p className="text-xs text-brand-muted">
                        I preventivi caricati dalle pagine di dettaglio richiesta appariranno qui.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
