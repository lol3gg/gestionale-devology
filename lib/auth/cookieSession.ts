type CookieLike = { name: string; value: string };

export type CookieAuth = {
  email: string;
  exp: number;
};

function decodeBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }
  return atob(normalized);
}

function decodeJwt(token: string): { email?: string; exp?: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64(payload)) as { email?: string; exp?: number };
  } catch {
    return null;
  }
}

function parseSessionRaw(raw: string): string | null {
  const value = raw.startsWith("base64-") ? decodeBase64(raw.slice(7)) : raw;
  try {
    const parsed = JSON.parse(value) as { access_token?: string } | string;
    if (typeof parsed === "string") return parsed;
    return parsed.access_token ?? null;
  } catch {
    return value.includes(".") ? value : null;
  }
}

/** Legge email/scadenza dal JWT nei cookie, senza chiamare Supabase. */
export function readAuthFromCookies(cookies: CookieLike[]): CookieAuth | null {
  const authCookies = cookies.filter(
    (cookie) => cookie.name.includes("-auth-token") && !cookie.name.includes("code-verifier")
  );
  if (authCookies.length === 0) return null;

  const groups = new Map<string, string[]>();
  for (const cookie of authCookies) {
    const match = /^(.*)\.(\d+)$/.exec(cookie.name);
    const base = match ? match[1] : cookie.name;
    const index = match ? Number(match[2]) : 0;
    const chunks = groups.get(base) ?? [];
    chunks[index] = cookie.value;
    groups.set(base, chunks);
  }

  const now = Math.floor(Date.now() / 1000);
  for (const chunks of Array.from(groups.values())) {
    const token = parseSessionRaw(chunks.filter(Boolean).join(""));
    if (!token) continue;
    const payload = decodeJwt(token);
    if (!payload?.exp || payload.exp <= now) continue;
    return { email: payload.email || "Admin", exp: payload.exp };
  }
  return null;
}

export function isAuthFresh(auth: CookieAuth | null, minSecondsLeft = 300) {
  if (!auth) return false;
  return auth.exp - Math.floor(Date.now() / 1000) > minSecondsLeft;
}
