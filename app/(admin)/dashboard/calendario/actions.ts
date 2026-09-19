"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CALL_DURATE,
  durataCall,
  intervalliSiSovrappongono,
  isIsoDate,
  isOraValida,
  normalizzaOra,
  oraFineCall,
  oraToMinuti,
} from "@/lib/calendario/date";
import { insertCall, listCalls, patchCall, removeCall, type CallActionResult } from "@/lib/calendario/store";
import { notificaLiveSync } from "@/lib/live/sync";
import type { CallAppuntamentoInput } from "@/lib/calendario/types";
import { inviaNotificheMattina } from "@/lib/notifiche/inviaMattina";
import { notificheConfigurate, vapidPublicKey } from "@/lib/notifiche/send";
import { removePushDevice, upsertPushDevice } from "@/lib/notifiche/subscriptions";
import type { PushSubscriptionJSON } from "@/lib/notifiche/types";
import { headers } from "next/headers";

function revalidateCalendario() {
  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard/calendario", "page");
}

function normalizzaInput(input: CallAppuntamentoInput): CallActionResult | CallAppuntamentoInput {
  const azienda = input.azienda.trim();
  const email = input.email?.trim() || null;
  const telefono = input.telefono?.trim() || null;
  const attivita = input.attivita?.trim() || null;
  const ora = normalizzaOra(input.ora);
  const durataMinuti = durataCall(input.durataMinuti);

  if (!azienda) {
    return { ok: false, error: "Inserisci il nome dell'azienda." };
  }
  if (!isIsoDate(input.giorno)) {
    return { ok: false, error: "Data non valida." };
  }
  if (!isOraValida(input.ora)) {
    return { ok: false, error: "Inserisci un orario valido." };
  }
  if (!CALL_DURATE.includes(durataMinuti as (typeof CALL_DURATE)[number])) {
    return { ok: false, error: "Durata non valida." };
  }
  if (email && !email.includes("@")) {
    return { ok: false, error: "Email non valida." };
  }

  return {
    giorno: input.giorno,
    ora,
    durataMinuti,
    azienda,
    email,
    telefono,
    attivita,
  };
}

async function verificaSovrapposizione(payload: CallAppuntamentoInput, excludeId?: string) {
  const supabase = createClient();
  const { calls, error } = await listCalls(supabase, payload.giorno, payload.giorno);
  if (error) return { ok: false as const, error };
  const start = oraToMinuti(payload.ora);
  const durata = durataCall(payload.durataMinuti);
  const conflitto = calls.find((call) => {
    if (call.id === excludeId) return false;
    return intervalliSiSovrappongono(start, durata, oraToMinuti(call.ora), durataCall(call.durataMinuti));
  });
  if (conflitto) {
    return {
      ok: false as const,
      error: `Orario già occupato da ${conflitto.azienda} (${conflitto.ora}–${oraFineCall(conflitto.ora, conflitto.durataMinuti)}). Scegli un altro inizio o una durata più corta.`,
    };
  }
  return { ok: true as const, supabase };
}

export async function createCall(input: CallAppuntamentoInput): Promise<CallActionResult> {
  const payload = normalizzaInput(input);
  if ("ok" in payload) return payload;

  const check = await verificaSovrapposizione(payload);
  if (!check.ok) return check;

  const result = await insertCall(check.supabase, payload);
  if (result.ok) {
    revalidateCalendario();
    await notificaLiveSync();
  }
  return result;
}

export async function updateCall(id: string, input: CallAppuntamentoInput): Promise<CallActionResult> {
  const payload = normalizzaInput(input);
  if ("ok" in payload) return payload;

  const check = await verificaSovrapposizione(payload, id);
  if (!check.ok) return check;

  const result = await patchCall(check.supabase, id, payload);
  if (result.ok) {
    revalidateCalendario();
    await notificaLiveSync();
  }
  return result;
}

export async function deleteCall(id: string): Promise<CallActionResult> {
  const result = await removeCall(createClient(), id);
  if (result.ok) {
    revalidateCalendario();
    await notificaLiveSync();
  }
  return result;
}

export async function getStatoNotificheMattina() {
  return {
    configurate: notificheConfigurate(),
    publicKey: vapidPublicKey(),
  };
}

export async function salvaIscrizionePush(subscription: PushSubscriptionJSON) {
  const supabase = createClient();
  const userAgent = headers().get("user-agent");
  await upsertPushDevice(supabase, subscription, userAgent);
  return { ok: true as const };
}

export async function rimuoviIscrizionePush(endpoint: string) {
  await removePushDevice(createClient(), endpoint);
  return { ok: true as const };
}

export async function inviaProvaNotificaMattina() {
  if (!notificheConfigurate()) {
    return { ok: false as const, error: "Notifiche non configurate sul server." };
  }
  try {
    const supabase = createClient();
    const result = await inviaNotificheMattina(supabase);
    if (result.total === 0) {
      return { ok: false as const, error: "Nessun telefono iscritto. Attiva le notifiche su questo dispositivo." };
    }
    if (result.sent === 0) {
      return { ok: false as const, error: result.failures[0] ?? "Invio non riuscito." };
    }
    const extra = result.richiamo
      ? ` + ${result.richiamo.title}`
      : "";
    return {
      ok: true as const,
      sent: result.sent,
      title: `${result.title}${extra}`,
      body: result.body,
    };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Errore nell'invio di prova." };
  }
}
