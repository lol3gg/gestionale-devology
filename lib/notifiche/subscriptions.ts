import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushDevice, PushSubscriptionJSON } from "./types";

const STORAGE_BUCKET = "preventivi-clienti";
const STORAGE_PATH = "notifiche/push-subscriptions.json";

function isNotFoundStorage(error: { message?: string; statusCode?: string | number; status?: string | number }) {
  const status = error.statusCode ?? error.status;
  return status === 404 || status === "404" || /not found|No such file/i.test(error.message ?? "");
}

async function loadDevices(supabase: SupabaseClient): Promise<PushDevice[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isNotFoundStorage(error)) return [];
    throw new Error(`Impossibile leggere le iscrizioni push: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { devices?: PushDevice[] };
    return Array.isArray(parsed.devices) ? parsed.devices.filter((item) => item?.endpoint && item.keys?.p256dh && item.keys?.auth) : [];
  } catch {
    return [];
  }
}

async function saveDevices(supabase: SupabaseClient, devices: PushDevice[]) {
  await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_PATH]);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
    STORAGE_PATH,
    Buffer.from(JSON.stringify({ devices }), "utf-8"),
    { contentType: "application/json", upsert: true }
  );
  if (error) {
    throw new Error(`Impossibile salvare le iscrizioni push: ${error.message}`);
  }
}

export async function listPushDevices(supabase: SupabaseClient) {
  return loadDevices(supabase);
}

export async function upsertPushDevice(
  supabase: SupabaseClient,
  subscription: PushSubscriptionJSON,
  userAgent: string | null
) {
  const devices = await loadDevices(supabase);
  const next: PushDevice = {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: subscription.keys,
    createdAt: devices.find((item) => item.endpoint === subscription.endpoint)?.createdAt ?? new Date().toISOString(),
    userAgent,
  };
  await saveDevices(supabase, [...devices.filter((item) => item.endpoint !== next.endpoint), next]);
}

export async function removePushDevice(supabase: SupabaseClient, endpoint: string) {
  const devices = await loadDevices(supabase);
  await saveDevices(
    supabase,
    devices.filter((item) => item.endpoint !== endpoint)
  );
}
