"use client";

import { createClient } from "@/lib/supabase/client";
import { getNavCounts, type NavCounts } from "./navCounts";

let cached: { at: number; value: NavCounts } | null = null;
let inflight: Promise<NavCounts> | null = null;
const TTL_MS = 20_000;

export function loadNavCountsClient() {
  if (cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(cached.value);
  if (inflight) return inflight;
  inflight = getNavCounts(createClient())
    .then((value) => {
      cached = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
