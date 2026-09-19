import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listContatti } from "@/lib/collaboratori/contattiStore";
import { demoContattiPer } from "@/lib/collaboratori/demoContatti";
import { STATO_CONTATTO_LABELS, isRichiamoUrgente, riepilogoContatti, type ContattoCollaboratore } from "@/lib/collaboratori/types";

export const dynamic = "force-dynamic";

function formatQuando(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CollaboratoreDettaglioPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.from("collaboratori").select("id, nome").eq("id", params.id).maybeSingle();
  if (error || !data) notFound();

  let contatti: ContattoCollaboratore[] = [];
  try {
    contatti = await listContatti(data.id);
  } catch {
    contatti = demoContattiPer(data.id);
  }
  const stats = riepilogoContatti(contatti);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/collaboratori" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted hover:text-brand-text">
          <ArrowLeft className="h-3.5 w-3.5" />
          Collaboratori
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Portale numeri
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          {data.nome}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Stessi numeri che vede lui nel link personale. Conversione: {stats.conversione}%.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini label="Numeri presi" value={stats.numeriPresi} />
        <Mini label="Attivi" value={stats.attivi} />
        <Mini label="Da richiamare" value={stats.daRichiamare} />
        <Mini label="Hanno detto no" value={stats.hannoDettoNo} />
      </div>

      <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
        <ul className="divide-y divide-brand-border">
          {contatti.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-brand-muted">Nessun contatto.</li>
          ) : (
            contatti.map((contatto) => (
              <li key={contatto.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-text">
                      {contatto.nome_azienda || contatto.referente || "Senza nome"}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {[contatto.referente, contatto.telefono, contatto.email].filter(Boolean).join(" · ")}
                    </p>
                    {contatto.stato === "call_fissata" && (
                      <p className="text-xs text-blue-300">Call {formatQuando(contatto.data_call)}</p>
                    )}
                    {contatto.stato === "da_richiamare" && (
                      <p className={`text-xs ${isRichiamoUrgente(contatto) ? "text-brand-accent-light" : "text-amber-300"}`}>
                        Richiamo {formatQuando(contatto.data_richiamo)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-soft ring-1 ring-inset ring-brand-border">
                    {STATO_CONTATTO_LABELS[contatto.stato]}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md">
      <p className="text-xl font-extrabold text-brand-text">{value}</p>
      <p className="mt-1 text-xs text-brand-muted">{label}</p>
    </div>
  );
}
