"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LIVE_CHANNEL, LIVE_EVENT, LIVE_TICK_BUCKET, LIVE_TICK_PATH } from "./sync";

const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;
let pollTimer: number | null = null;
let lastTick = "";

function fire() {
  listeners.forEach((listener) => listener());
}

function ensureChannel() {
  if (channel) return channel;
  const supabase = createClient();
  for (const current of supabase.getChannels()) {
    if (current.topic.includes(LIVE_CHANNEL)) {
      void supabase.removeChannel(current);
    }
  }
  channel = supabase
    .channel(LIVE_CHANNEL, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: LIVE_EVENT }, () => fire())
    .on("postgres_changes", { event: "*", schema: "public" }, () => fire())
    .subscribe();
  return channel;
}

async function leggiTick() {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(LIVE_TICK_BUCKET).download(LIVE_TICK_PATH);
  if (error || !data) return "";
  try {
    const parsed = JSON.parse(await data.text()) as { t?: string | number };
    return parsed.t != null ? String(parsed.t) : "";
  } catch {
    return "";
  }
}

function avviaPoll() {
  if (pollTimer != null) return;
  pollTimer = window.setInterval(async () => {
    if (document.visibilityState === "hidden") return;
    const tick = await leggiTick();
    if (!tick) return;
    if (!lastTick) {
      lastTick = tick;
      return;
    }
    if (tick !== lastTick) {
      lastTick = tick;
      fire();
    }
  }, 2000);
}

export function subscribeLiveSync(onSync: () => void) {
  listeners.add(onSync);
  ensureChannel();
  avviaPoll();
  return () => {
    listeners.delete(onSync);
  };
}

export function segnalaModifica() {
  const supabase = createClient();
  const active = ensureChannel();
  const tick = String(Date.now());
  void active.send({
    type: "broadcast",
    event: LIVE_EVENT,
    payload: { t: tick },
  });
  void supabase.storage.from(LIVE_TICK_BUCKET).upload(
    LIVE_TICK_PATH,
    new Blob([JSON.stringify({ t: tick })], { type: "application/json" }),
    { upsert: true, contentType: "application/json" }
  );
}

export function refreshTutti(router: { refresh: () => void }) {
  segnalaModifica();
  router.refresh();
}
