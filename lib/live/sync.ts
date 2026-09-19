export const LIVE_CHANNEL = "gestionale-live";
export const LIVE_EVENT = "sync";
export const LIVE_TICK_BUCKET = "preventivi-clienti";
export const LIVE_TICK_PATH = "live/sync.json";

/** Avvisa gli altri tab/app aperti. Va chiamato dopo ogni scrittura riuscita. */
export async function notificaLiveSync() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const tick = String(Date.now());
  await Promise.allSettled([
    fetch(`${url}/realtime/v1/api/broadcast`, {
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
            payload: { t: tick },
          },
        ],
      }),
      cache: "no-store",
    }),
    fetch(`${url}/storage/v1/object/${LIVE_TICK_BUCKET}/${LIVE_TICK_PATH}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify({ t: tick }),
      cache: "no-store",
    }),
  ]);
}
