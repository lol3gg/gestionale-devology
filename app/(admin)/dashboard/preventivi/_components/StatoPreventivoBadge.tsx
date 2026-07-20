"use client";

import {
  STATO_PREVENTIVO_BADGE,
  getStatoPreventivoLabel,
  isStatoPreventivo,
  type StatoPreventivo,
} from "@/lib/preventivi/stato";

export function StatoPreventivoBadge({ stato }: { stato: string }) {
  const key: StatoPreventivo = isStatoPreventivo(stato) ? stato : "inviato";
  const classes = STATO_PREVENTIVO_BADGE[key];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {getStatoPreventivoLabel(key)}
    </span>
  );
}
