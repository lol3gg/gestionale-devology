import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listContatti, listTuttiContatti } from "@/lib/collaboratori/contattiStore";
import type { ContattoCollaboratore } from "@/lib/collaboratori/types";

function formatQuando(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function ProssimeCallCollaboratori() {
  const supabase = createClient();
  const { data: collabs } = await supabase.from("collaboratori").select("id, nome").eq("attivo", true);
  const nomi = new Map((collabs ?? []).map((row) => [row.id, row.nome]));

  let contatti: ContattoCollaboratore[] = [];
  try {
    contatti = await listTuttiContatti();
  } catch {
    contatti = [];
  }
  if (contatti.length === 0) {
    for (const row of collabs ?? []) {
      try {
        contatti.push(...(await listContatti(row.id)));
      } catch {
        // ignore
      }
    }
  }

  const upcoming = contatti
    .filter((item) => item.stato === "call_fissata" && item.data_call)
    .sort((a, b) => String(a.data_call).localeCompare(String(b.data_call)))
    .slice(0, 8);

  if (upcoming.length === 0) return null;

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/25">
          <CalendarClock className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-brand-text">Prossime call dei collaboratori</h2>
          <p className="mt-0.5 text-xs text-brand-muted">
            Call fissate da chi porta i numeri a freddo, in ordine di data.
          </p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-brand-border">
        {upcoming.map((call) => (
          <li key={call.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-text">
                {call.nome_azienda || call.referente || "Contatto"}
              </p>
              <p className="text-xs text-brand-muted">
                {nomi.get(call.collaboratore_id) ?? "Collaboratore"}
                {call.referente && call.nome_azienda ? ` · ${call.referente}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-xs font-semibold text-blue-300">{formatQuando(String(call.data_call))}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/collaboratori"
        className="mt-3 inline-block text-xs font-semibold text-brand-accent-light hover:underline"
      >
        Vai ai collaboratori
      </Link>
    </section>
  );
}
