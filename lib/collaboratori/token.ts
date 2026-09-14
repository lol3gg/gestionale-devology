import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SIG_LENGTH = 22;

function portaleHmacSecret() {
  return `devology-portale:${process.env.NEXT_PUBLIC_SUPABASE_URL}:${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}

function firmaPayload(payload: string) {
  return createHmac("sha256", portaleHmacSecret()).update(payload).digest("base64url").slice(0, SIG_LENGTH);
}

function verificaFirma(payload: string, sig: string) {
  const expected = firmaPayload(payload);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}

function parsePayload(payload: string): { id: string; nome: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      i?: string;
      n?: string;
    };
    if (!parsed.i || !parsed.n) return null;
    return { id: parsed.i, nome: parsed.n };
  } catch {
    return null;
  }
}

/**
 * Token URL-safe senza punti (WhatsApp/telefoni spezzano gli URL al ".").
 * Formato: payloadBase64url + firma da 22 caratteri.
 */
export function generaTokenCollaboratore(info?: { id: string; nome: string }) {
  if (!info) {
    return randomBytes(24).toString("base64url").slice(0, 32);
  }
  const payload = Buffer.from(
    JSON.stringify({
      i: info.id,
      n: info.nome.trim().slice(0, 80),
      r: randomBytes(6).toString("base64url"),
    }),
    "utf8"
  ).toString("base64url");
  return `${payload}${firmaPayload(payload)}`;
}

export function leggiTokenCollaboratore(token: string): { id: string; nome: string } | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot > 0) {
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!verificaFirma(payload, sig)) return null;
    return parsePayload(payload);
  }

  if (token.length <= SIG_LENGTH) return null;
  const payload = token.slice(0, -SIG_LENGTH);
  const sig = token.slice(-SIG_LENGTH);
  if (!verificaFirma(payload, sig)) return null;
  return parsePayload(payload);
}

export function isTokenCollaboratore(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[A-Za-z0-9_.-]{24,400}$/.test(value);
}

export function pathPortaleCollaboratore(token: string) {
  return `/collab/${token}`;
}

export function tokenPortaleCondivisibile(token: string | null | undefined) {
  return Boolean(token && leggiTokenCollaboratore(token) && !token.includes("."));
}
