export const LIVE_CHANNEL = "gestionale-live";
export const LIVE_EVENT = "sync";

/** Avvisa gli altri tab/app aperti, senza bloccare il salvataggio. */
export function notificaLiveSync() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 350);
  void fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          topic: LIVE_CHANNEL,
          event: LIVE_EVENT,
          payload: { t: String(Date.now()) },
        },
      ],
    }),
    cache: "no-store",
    signal: controller.signal,
  })
    .catch(() => undefined)
    .finally(() => clearTimeout(timeout));
}
