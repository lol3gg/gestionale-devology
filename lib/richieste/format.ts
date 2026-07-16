/** Formatta una data come "16 lug 2026". */
export function formatDataBreve(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
