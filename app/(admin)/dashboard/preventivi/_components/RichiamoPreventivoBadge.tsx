import { Phone } from "lucide-react";
import { labelRichiamoPreventivo } from "@/lib/preventivi/richiamo";

export function RichiamoPreventivoBadge({
  dataInvio,
  stato,
}: {
  dataInvio: string;
  stato: string;
}) {
  const label = labelRichiamoPreventivo(dataInvio, stato);
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
        label.urgente
          ? "bg-amber-500/20 text-amber-200 ring-amber-400/40"
          : "bg-brand-surface text-brand-muted ring-brand-border"
      }`}
    >
      <Phone className="h-3 w-3" />
      {label.testo}
    </span>
  );
}
