import { Repeat, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatEuro } from "@/lib/contabilita/format";

type Tone = "positive" | "negative" | "neutral";

const TONE_CLASSES: Record<Tone, { icon: string; value: string }> = {
  positive: { icon: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25", value: "text-emerald-300" },
  negative: { icon: "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/25", value: "text-brand-accent-light" },
  neutral: { icon: "bg-blue-500/15 text-blue-300 ring-blue-500/25", value: "text-brand-text" },
};

type RiepilogoCardsProps = {
  entrateTotali: number;
  usciteTotali: number;
  saldoNetto: number;
  abbonamentiTotale: number;
};

export function RiepilogoCards({
  entrateTotali,
  usciteTotali,
  saldoNetto,
  abbonamentiTotale,
}: RiepilogoCardsProps) {
  const cards: { label: string; value: number; icon: typeof TrendingUp; tone: Tone; hint?: string }[] = [
    { label: "Entrate del periodo", value: entrateTotali, icon: TrendingUp, tone: "positive" },
    {
      label: "Uscite del periodo",
      value: usciteTotali,
      icon: TrendingDown,
      tone: "negative",
      hint: "incluse le quote abbonamenti attivi nel periodo",
    },
    {
      label: "Saldo netto",
      value: saldoNetto,
      icon: Wallet,
      tone: saldoNetto >= 0 ? "positive" : "negative",
    },
    {
      label: "Abbonamenti attivi",
      value: abbonamentiTotale,
      icon: Repeat,
      tone: "neutral",
      hint: "costo mensile ricorrente",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = TONE_CLASSES[card.tone];

        return (
          <div
            key={card.label}
            className="rounded-brand-lg border border-brand-border bg-brand-elevated p-3.5 shadow-brand-md sm:p-5"
          >
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset sm:h-9 sm:w-9 ${tone.icon}`}>
              <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
            </span>
            <p className={`mt-2.5 text-lg font-extrabold tracking-[-0.02em] sm:mt-3.5 sm:text-3xl ${tone.value}`}>
              {formatEuro(card.value)}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-brand-muted sm:text-xs">{card.label}</p>
            {card.hint && <p className="mt-0.5 hidden text-[11px] text-brand-muted/70 sm:block">{card.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
