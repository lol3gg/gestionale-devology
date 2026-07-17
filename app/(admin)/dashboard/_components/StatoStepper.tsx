import { Check } from "lucide-react";
import { STATO_OPTIONS, STATO_PROGRESS_ORDER, type StatoRichiesta } from "@/lib/richieste/stato";

/**
 * Mini "funnel" visivo che mostra l'avanzamento della richiesta lungo gli
 * stati principali. Se lo stato attuale è "rifiutato" o "archiviato" (stati
 * fuori dal funnel), viene mostrato uno stepper "congelato" più un'etichetta
 * dedicata, invece di forzarlo dentro una sequenza che non rappresenta.
 */
export function StatoStepper({ stato }: { stato: string }) {
  const isOffFunnel = stato === "rifiutato" || stato === "archiviato";
  const currentIndex = STATO_PROGRESS_ORDER.indexOf(stato as StatoRichiesta);

  return (
    <div className="flex items-center">
      {STATO_PROGRESS_ORDER.map((step, index) => {
        const label = STATO_OPTIONS.find((option) => option.value === step)?.label ?? step;
        const isDone = !isOffFunnel && currentIndex > index;
        const isCurrent = !isOffFunnel && currentIndex === index;
        const isLast = index === STATO_PROGRESS_ORDER.length - 1;

        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ring-1 ring-inset transition ${
                  isDone
                    ? "bg-brand-accent text-white ring-brand-accent"
                    : isCurrent
                      ? "bg-brand-accent/15 text-brand-accent-light ring-brand-accent/50"
                      : "bg-brand-surface text-brand-muted ring-brand-border-strong"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span
                className={`hidden text-center text-[11px] font-medium sm:block ${
                  isCurrent ? "text-brand-text" : isDone ? "text-brand-soft" : "text-brand-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-1.5 h-0.5 flex-1 rounded-full transition ${
                  isDone ? "bg-brand-accent" : "bg-brand-border-strong"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
