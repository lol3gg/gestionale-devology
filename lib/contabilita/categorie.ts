export type TipoMovimento = "entrata" | "uscita";

export type CategoriaMovimento =
  | "vendita_app"
  | "abbonamento_software"
  | "prontopro"
  | "pubblicita_ads"
  | "lavoro_esterno"
  | "attrezzatura"
  | "staff"
  | "altro";

export const CATEGORIA_OPTIONS: { value: CategoriaMovimento; label: string }[] = [
  { value: "vendita_app", label: "Vendita app" },
  { value: "abbonamento_software", label: "Abbonamento software" },
  { value: "prontopro", label: "ProntoPro" },
  { value: "pubblicita_ads", label: "Pubblicità/Ads" },
  { value: "lavoro_esterno", label: "Lavoro esterno" },
  { value: "attrezzatura", label: "Attrezzatura" },
  { value: "staff", label: "Staff" },
  { value: "altro", label: "Altro" },
];

export function getCategoriaLabel(categoria: string) {
  return CATEGORIA_OPTIONS.find((option) => option.value === categoria)?.label ?? categoria;
}
