import type { SupabaseClient } from "@supabase/supabase-js";
import { oggiIsoRoma } from "@/lib/calendario/date";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "notifiche/mattina-inviate.json";

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

export async function giaInviataOggi(supabase: SupabaseClient) {
  const oggi = oggiIsoRoma();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return false;
    throw new Error(error.message);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { giorno?: string };
    return parsed.giorno === oggi;
  } catch {
    return false;
  }
}

export async function marcaInviataOggi(supabase: SupabaseClient) {
  const oggi = oggiIsoRoma();
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(JSON.stringify({ giorno: oggi, at: new Date().toISOString() }), "utf-8"),
    { contentType: "application/json", upsert: true }
  );
  if (error) {
    throw new Error(error.message);
  }
}

export function isFinestraSetteECinquanta() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? -1);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? -1);
  return hour === 7 && minute >= 50 && minute <= 59;
}
