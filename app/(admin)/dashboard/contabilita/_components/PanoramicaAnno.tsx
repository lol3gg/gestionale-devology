import { CalendarRange, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatEuro } from "@/lib/contabilita/format";

type PanoramicaAnnoProps = {
  anno: number;
  entrateUnaTantum: number;
  canoniAnno: number;
  usciteUnaTantum: number;
  abbonamentiAnno: number;
};

export function PanoramicaAnno({
  anno,
  entrateUnaTantum,
  canoniAnno,
  usciteUnaTantum,
  abbonamentiAnno,
}: PanoramicaAnnoProps) {
  const entrate = entrateUnaTantum + canoniAnno;
  const uscite = usciteUnaTantum + abbonamentiAnno;
  const utile = entrate - uscite;

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/25">
          <CalendarRange className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-brand-text">Panoramica fino a fine {anno}</h2>
          <p className="mt-0.5 text-xs text-brand-muted">
            Movimenti già registrati + canoni e abbonamenti attivi ripartiti su tutto l&apos;anno.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniCard icon={TrendingUp} label="Entrate stimate" value={formatEuro(entrate)} tone="positive" />
        <MiniCard icon={TrendingDown} label="Uscite stimate" value={formatEuro(uscite)} tone="negative" />
        <MiniCard
          icon={Wallet}
          label="Utile stimato"
          value={formatEuro(utile)}
          tone={utile >= 0 ? "positive" : "negative"}
        />
        <MiniCard icon={TrendingUp} label="Di cui canoni assistenza" value={formatEuro(canoniAnno)} tone="neutral" />
      </div>
    </section>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const valueClass =
    tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-brand-accent-light" : "text-brand-text";
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface px-3 py-3">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold sm:text-lg ${valueClass}`}>{value}</p>
    </div>
  );
}
