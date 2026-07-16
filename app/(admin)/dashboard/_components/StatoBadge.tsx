import { STATO_BADGE_CLASSES, getStatoLabel, type StatoRichiesta } from "@/lib/richieste/stato";

export function StatoBadge({ stato }: { stato: string }) {
  const classes =
    STATO_BADGE_CLASSES[stato as StatoRichiesta] ?? "bg-gray-100 text-gray-700 ring-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {getStatoLabel(stato)}
    </span>
  );
}
