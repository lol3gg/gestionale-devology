import { STATO_OPTIONS, type StatoRichiesta } from "@/lib/richieste/stato";
import { TIPO_PROGETTO_OPTIONS } from "@/lib/richieste/progetto";

export const RICHIESTE_PER_PAGINA = 20;

export type DashboardQuery = {
  pagina: number;
  q: string;
  stato: StatoRichiesta | "";
  tipo: string;
};

/**
 * Escape per valori usati in filtri PostgREST `ilike`:
 * - caratteri jolly ILIKE (% _)
 * - virgolette (il valore va wrappato in "...")
 */
export function escapeIlike(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/"/g, '\\"');
}

export function parseDashboardQuery(searchParams: {
  pagina?: string;
  q?: string;
  stato?: string;
  tipo?: string;
}): DashboardQuery {
  const paginaRaw = Number.parseInt(searchParams.pagina ?? "1", 10);
  const pagina = Number.isFinite(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;

  const q = (searchParams.q ?? "").trim();

  const statoCandidate = searchParams.stato ?? "";
  const stato =
    STATO_OPTIONS.some((option) => option.value === statoCandidate)
      ? (statoCandidate as StatoRichiesta)
      : "";

  const tipoCandidate = searchParams.tipo ?? "";
  const tipo = (TIPO_PROGETTO_OPTIONS as readonly string[]).includes(tipoCandidate)
    ? tipoCandidate
    : "";

  return { pagina, q, stato, tipo };
}

/** Costruisce la query string dashboard preservando filtri e pagina. */
export function buildDashboardHref(params: {
  pagina?: number;
  q?: string;
  stato?: string;
  tipo?: string;
}) {
  const search = new URLSearchParams();

  if (params.pagina && params.pagina > 1) {
    search.set("pagina", String(params.pagina));
  }
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.stato) search.set("stato", params.stato);
  if (params.tipo) search.set("tipo", params.tipo);

  const qs = search.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}
