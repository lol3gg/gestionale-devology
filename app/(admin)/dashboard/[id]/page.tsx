import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  FileQuestion,
  Layers,
  Mail,
  MessageSquareQuote,
  Paperclip,
  Phone,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAvatarClasses, getInitials } from "@/lib/richieste/initials";
import { getGiorniAllaScadenza, formatEuro } from "@/lib/richieste/format";
import { regenerateSignedUrl } from "@/lib/storage/signedUrl";
import { StatoSelect } from "../_components/StatoSelect";
import { StatoBadge } from "../_components/StatoBadge";
import { StatoStepper } from "../_components/StatoStepper";
import { NoteInterneForm } from "../_components/NoteInterneForm";
import { FileIcon } from "../_components/FileIcon";
import { PreventiviManager, type PreventivoItem } from "../_components/PreventiviManager";

export const dynamic = "force-dynamic";

const ALLEGATI_BUCKET = "allegati-clienti";
const PREVENTIVI_BUCKET = "preventivi-clienti";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4; // 4 ore

function DetailItem({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  warning?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-brand-text">{value}</dd>
        {warning && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-accent/15 px-2 py-0.5 text-[11px] font-semibold text-brand-accent-light ring-1 ring-inset ring-brand-accent/30">
            <AlertTriangle className="h-3 w-3" />
            {warning}
          </span>
        )}
      </div>
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

  // Avviso visivo se la scadenza richiesta dal cliente è vicina (entro 2 settimane) o già superata.
  const giorniAllaScadenza = getGiorniAllaScadenza(richiesta.tempistiche);
  let scadenzaWarning: string | undefined;
  if (giorniAllaScadenza !== null) {
    if (giorniAllaScadenza < 0) {
      scadenzaWarning = `Scadenza superata di ${Math.abs(giorniAllaScadenza)} giorni`;
    } else if (giorniAllaScadenza === 0) {
      scadenzaWarning = "Scade oggi";
    } else if (giorniAllaScadenza <= 14) {
      scadenzaWarning = `Scade in ${giorniAllaScadenza} giorni`;
    }
  }

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
          <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md">
            <h2 className="text-base font-semibold text-brand-text">Dettagli richiesta</h2>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailItem icon={Mail} label="Email" value={richiesta.email} />
              <DetailItem icon={Phone} label="Telefono" value={richiesta.telefono ?? "—"} />
              <DetailItem
                icon={Building2}
                label="Tipo cliente"
                value={richiesta.tipo_cliente === "azienda" ? "Azienda" : "Privato"}
              />
              {richiesta.tipo_cliente === "azienda" && (
                <>
                  <DetailItem
                    icon={Building2}
                    label="Nome azienda"
                    value={richiesta.nome_azienda ?? "—"}
                  />
                  <DetailItem icon={FileQuestion} label="Partita IVA" value={richiesta.partita_iva ?? "—"} />
                </>
              )}
              <DetailItem icon={Layers} label="Tipo progetto" value={richiesta.tipo_progetto ?? "—"} />
              <DetailItem
                icon={Wallet}
                label="Budget indicativo"
                value={richiesta.budget != null ? formatEuro(richiesta.budget) : "—"}
              />
              <DetailItem
                icon={Calendar}
                label="Scadenza richiesta"
                value={richiesta.tempistiche ?? "—"}
                warning={scadenzaWarning}
              />
              <DetailItem
                icon={MessageSquareQuote}
                label="Come ci ha conosciuto"
                value={richiesta.come_conosciuto ?? "—"}
              />
              <DetailItem
                icon={Calendar}
                label="Data richiesta"
                value={new Date(richiesta.created_at).toLocaleString("it-IT")}
              />
            </dl>

            <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-soft">
                <MessageSquareQuote className="h-4 w-4 text-brand-accent-light" />
                Descrizione progetto
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
                {richiesta.descrizione_progetto}
              </p>
            </div>

            {richiesta.tipo_progetto && (
              <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-soft">
                  <Layers className="h-4 w-4 text-brand-accent-light" />
                  Specifiche tecniche
                </h3>
                {richiesta.specifiche_tecniche && richiesta.specifiche_tecniche.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {richiesta.specifiche_tecniche.map((specifica: string) => (
                      <li
                        key={specifica}
                        className="rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent-light ring-1 ring-inset ring-brand-accent/25"
                      >
                        {specifica}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-brand-muted">Nessuna specifica indicata.</p>
                )}
              </div>
            )}
          </section>

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
    </div>
  );
}
