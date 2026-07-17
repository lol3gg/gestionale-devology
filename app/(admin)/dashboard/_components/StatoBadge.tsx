import {
  STATO_BADGE_CLASSES,
  STATO_DOT_CLASSES,
  getStatoLabel,
  type StatoRichiesta,
} from "@/lib/richieste/stato";

export function StatoBadge({ stato }: { stato: string }) {
  const classes =
    STATO_BADGE_CLASSES[stato as StatoRichiesta] ?? "bg-white/10 text-brand-soft ring-white/15";
  const dotClass = STATO_DOT_CLASSES[stato as StatoRichiesta] ?? "bg-brand-soft";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {getStatoLabel(stato)}
    </span>
  );
}
