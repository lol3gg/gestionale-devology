"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LIVE_CHANNEL, LIVE_EVENT } from "./sync";

const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;

function fire() {
  listeners.forEach((listener) => listener());
}

function ensureChannel(): RealtimeChannel {
  if (channel) return channel;
  const supabase = createClient();
  for (const current of supabase.getChannels()) {
    if (current.topic.includes(LIVE_CHANNEL)) {
      void supabase.removeChannel(current);
    }
  }
  const next = supabase
    .channel(LIVE_CHANNEL, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: LIVE_EVENT }, () => fire())
    .subscribe();
  channel = next;
  return next;
}

export function subscribeLiveSync(onSync: () => void) {
  listeners.add(onSync);
  ensureChannel();
  return () => {
    listeners.delete(onSync);
  };
}

export function segnalaModifica() {
  const active = ensureChannel();
  void active.send({
    type: "broadcast",
    event: LIVE_EVENT,
    payload: { t: Date.now() },
  });
}

export function refreshTutti(router: { refresh: () => void }) {
  segnalaModifica();
  router.refresh();
}
