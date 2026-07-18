import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Mail, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";
import { regenerateSignedUrl } from "@/lib/storage/signedUrl";
import { StatoSelect } from "../_components/StatoSelect";
import { StatoBadge } from "../_components/StatoBadge";
import { StatoStepper } from "../_components/StatoStepper";
import { NoteInterneForm } from "../_components/NoteInterneForm";
import { FileIcon } from "../_components/FileIcon";
import { PreventiviManager, type PreventivoItem } from "../_components/PreventiviManager";
import { ModificaRichiestaForm } from "../_components/ModificaRichiestaForm";
import { EliminaRichiestaButton } from "../_components/EliminaRichiestaButton";
import { ArchiviaRichiestaButton } from "../_components/ArchiviaRichiestaButton";
import type { TipoCliente } from "../actions";

export const dynamic = "force-dynamic";

const ALLEGATI_BUCKET = "allegati-clienti";
const PREVENTIVI_BUCKET = "preventivi-clienti";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4; // 4 ore

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

  const [{ data: allegatiRows }, { data: preventiviRows }] = await Promise.all([
    supabase
      .from("allegati")
      .select("id, nome_file, url_file, created_at")
      .eq("richiesta_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("preventivi")
      .select("id, numero_preventivo, data_invio, nome_file, url_file, created_at")
      .eq("richiesta_id", params.id)
      .order("data_invio", { ascending: false }),
  ]);

  const allegati = await Promise.all(
    (allegatiRows ?? []).map(async (allegato) => ({
      ...allegato,
      downloadUrl: await regenerateSignedUrl(
        supabase,
        ALLEGATI_BUCKET,
        allegato.url_file,
        SIGNED_URL_EXPIRY_SECONDS
      ),
    }))
  );

  const preventivi: PreventivoItem[] = await Promise.all(
    (preventiviRows ?? []).map(async (preventivo) => ({
      ...preventivo,
      downloadUrl: await regenerateSignedUrl(
        supabase,
        PREVENTIVI_BUCKET,
        preventivo.url_file,
        SIGNED_URL_EXPIRY_SECONDS
      ),
    }))
  );

  const nomeCompleto = `${richiesta.nome} ${richiesta.cognome}`.trim();
  const avatarClasses = getAvatarClasses(richiesta.id);
  const isOffFunnel = richiesta.stato === "rifiutato" || richiesta.stato === "archiviato";
  const tipoCliente: TipoCliente =
    richiesta.tipo_cliente === "azienda" ? "azienda" : "privato";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted transition hover:text-brand-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla dashboard
      </Link>

      <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ring-1 ring-inset ${avatarClasses}`}
            >
              {getInitials(richiesta.nome, richiesta.cognome)}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-brand-text">
                {nomeCompleto}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-muted">
                <Mail className="h-3.5 w-3.5" />
                {richiesta.email}
              </p>
              <div className="mt-2">
                <StatoBadge stato={richiesta.stato} />
              </div>
            </div>
          </div>

          <StatoSelect richiestaId={richiesta.id} statoIniziale={richiesta.stato} />
        </div>

        <div className="mt-6 border-t border-brand-border pt-5">
          {isOffFunnel && (
            <p className="mb-3 text-xs font-medium text-brand-muted">
              Questa richiesta è uscita dal normale flusso di avanzamento.
            </p>
          )}
          <StatoStepper stato={richiesta.stato} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ModificaRichiestaForm
            richiesta={{
              id: richiesta.id,
              nome: richiesta.nome,
              cognome: richiesta.cognome,
              email: richiesta.email,
              telefono: richiesta.telefono,
              tipo_cliente: tipoCliente,
              nome_azienda: richiesta.nome_azienda,
              partita_iva: richiesta.partita_iva,
              descrizione_progetto: richiesta.descrizione_progetto,
              tipo_progetto: richiesta.tipo_progetto,
              specifiche_tecniche: richiesta.specifiche_tecniche,
              budget: richiesta.budget != null ? Number(richiesta.budget) : null,
              tempistiche: richiesta.tempistiche,
              come_conosciuto: richiesta.come_conosciuto,
              created_at: richiesta.created_at,
            }}
          />

          <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
            <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text">
              <Paperclip className="h-4 w-4 text-brand-accent-light" />
              Allegati
              {allegati.length > 0 && (
                <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-semibold text-brand-muted ring-1 ring-inset ring-brand-border">
                  {allegati.length}
                </span>
              )}
            </h2>
            {allegati.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">Nessun allegato caricato.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {allegati.map((allegato) => (
                  <li
                    key={allegato.id}
                    className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-elevated text-brand-accent-light ring-1 ring-inset ring-brand-border">
                      <FileIcon fileName={allegato.nome_file} className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-brand-text">
                      {allegato.nome_file}
                    </p>
                    {allegato.downloadUrl ? (
                      <a
                        href={allegato.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Scarica ${allegato.nome_file}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-soft transition hover:bg-brand-accent/10 hover:text-brand-accent-light"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-brand-accent-light">N/D</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <PreventiviManager richiestaId={richiesta.id} preventiviIniziali={preventivi} />
        </div>

        <div className="space-y-6">
          <NoteInterneForm richiestaId={richiesta.id} noteIniziali={richiesta.note_interne ?? ""} />
        </div>
      </div>

      <div className="space-y-4">
        <ArchiviaRichiestaButton
          richiestaId={richiesta.id}
          statoCorrente={richiesta.stato}
        />
        <EliminaRichiestaButton
          richiestaId={richiesta.id}
          nomeCliente={nomeCompleto || "questa richiesta"}
        />
      </div>
    </div>
  );
}
