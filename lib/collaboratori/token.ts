import { randomBytes } from "crypto";

/** Token URL-safe da 32 caratteri, non sequenziale e non indovinabile. */
export function generaTokenCollaboratore() {
  return randomBytes(24).toString("base64url").slice(0, 32);
}

export function isTokenCollaboratore(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[A-Za-z0-9_-]{24,64}$/.test(value);
}
