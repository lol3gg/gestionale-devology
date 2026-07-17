/** Estrae le iniziali (max 2 lettere) da nome e cognome, per gli avatar in dashboard. */
export function getInitials(nome: string, cognome?: string | null) {
  const first = nome?.trim().charAt(0) ?? "";
  const second = cognome?.trim().charAt(0) ?? "";
  const initials = `${first}${second}`.toUpperCase();
  return initials || "?";
}

/**
 * Palette di sfondi per gli avatar, derivata deterministicamente dal nome
 * (stesso cliente = stesso colore), in tonalità coerenti col tema scuro.
 */
const AVATAR_PALETTE = [
  "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  "bg-blue-500/15 text-blue-300 ring-blue-500/25",
  "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25",
  "bg-orange-500/15 text-orange-300 ring-orange-500/25",
];

export function getAvatarClasses(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
