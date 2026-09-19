import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listPushDevices, removePushDevice } from "./subscriptions";
import type { NotificaMattinaPayload, PushDevice } from "./types";

export function vapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
}

function configureVapid() {
  const publicKey = vapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:devologysystem243@gmail.com";
  if (!publicKey || !privateKey) {
    throw new Error("Mancano NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function notificheConfigurate() {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export async function sendPushToDevice(device: PushDevice, payload: NotificaMattinaPayload) {
  configureVapid();
  await webpush.sendNotification(
    {
      endpoint: device.endpoint,
      keys: device.keys,
    },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 12 }
  );
}

export async function sendPushToAll(supabase: SupabaseClient, payload: NotificaMattinaPayload) {
  const devices = await listPushDevices(supabase);
  let sent = 0;
  const failures: string[] = [];

  for (const device of devices) {
    try {
      await sendPushToDevice(device, payload);
      sent += 1;
    } catch (error) {
      const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (status === 404 || status === 410) {
        await removePushDevice(supabase, device.endpoint);
      }
      failures.push(error instanceof Error ? error.message : "Invio fallito");
    }
  }

  return { sent, total: devices.length, failures };
}
