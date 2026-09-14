"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CALL_DURATE, SLOT_ORE, durataCall, isIsoDate, normalizzaOra } from "@/lib/calendario/date";
import { insertCall, patchCall, removeCall, type CallActionResult } from "@/lib/calendario/store";
import type { CallAppuntamentoInput } from "@/lib/calendario/types";

function revalidateCalendario() {
  revalidatePath("/dashboard/calendario");
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
  if (!SLOT_ORE.includes(ora)) {
    return { ok: false, error: "Orario non valido: le fasce sono ogni 10 minuti, dalle 04:00 alle 19:30." };
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

export async function createCall(input: CallAppuntamentoInput): Promise<CallActionResult> {
  const payload = normalizzaInput(input);
  if ("ok" in payload) return payload;

  const result = await insertCall(createClient(), payload);
  if (result.ok) revalidateCalendario();
  return result;
}

export async function updateCall(id: string, input: CallAppuntamentoInput): Promise<CallActionResult> {
  const payload = normalizzaInput(input);
  if ("ok" in payload) return payload;

  const result = await patchCall(createClient(), id, payload);
  if (result.ok) revalidateCalendario();
  return result;
}

export async function deleteCall(id: string): Promise<CallActionResult> {
  const result = await removeCall(createClient(), id);
  if (result.ok) revalidateCalendario();
  return result;
}
