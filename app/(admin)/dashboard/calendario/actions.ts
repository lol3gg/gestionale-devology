"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SLOT_ORE, isIsoDate, normalizzaOra } from "@/lib/calendario/date";
import type { CallAppuntamentoInput } from "@/lib/calendario/types";

function revalidateCalendario() {
  revalidatePath("/dashboard/calendario");
}

function normalizzaInput(input: CallAppuntamentoInput): CallAppuntamentoInput {
  const azienda = input.azienda.trim();
  const email = input.email?.trim() || null;
  const telefono = input.telefono?.trim() || null;
  const attivita = input.attivita?.trim() || null;
  const ora = normalizzaOra(input.ora);

  if (!azienda) {
    throw new Error("Inserisci il nome dell'azienda.");
  }
  if (!isIsoDate(input.giorno)) {
    throw new Error("Data non valida.");
  }
  if (!SLOT_ORE.includes(ora)) {
    throw new Error("Orario non valido: le call sono ogni 30 minuti, dalle 08:00 alle 20:30.");
  }
  if (email && !email.includes("@")) {
    throw new Error("Email non valida.");
  }

  return {
    giorno: input.giorno,
    ora,
    azienda,
    email,
    telefono,
    attivita,
  };
}

function throwDbError(error: { code?: string; message: string }, fallback: string): never {
  if (error.code === "23505") {
    throw new Error("C'è già una call in questo orario.");
  }
  throw new Error(`${fallback}: ${error.message}`);
}

export async function createCall(input: CallAppuntamentoInput) {
  const payload = normalizzaInput(input);
  const supabase = createClient();
  const { error } = await supabase.from("call_appuntamenti").insert({
    giorno: payload.giorno,
    ora: payload.ora,
    azienda: payload.azienda,
    email: payload.email,
    telefono: payload.telefono,
    attivita: payload.attivita,
  });

  if (error) throwDbError(error, "Impossibile fissare la call");
  revalidateCalendario();
}

export async function updateCall(id: string, input: CallAppuntamentoInput) {
  const payload = normalizzaInput(input);
  const supabase = createClient();
  const { error } = await supabase
    .from("call_appuntamenti")
    .update({
      giorno: payload.giorno,
      ora: payload.ora,
      azienda: payload.azienda,
      email: payload.email,
      telefono: payload.telefono,
      attivita: payload.attivita,
    })
    .eq("id", id);

  if (error) throwDbError(error, "Impossibile aggiornare la call");
  revalidateCalendario();
}

export async function deleteCall(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("call_appuntamenti").delete().eq("id", id);

  if (error) {
    throw new Error(`Impossibile eliminare la call: ${error.message}`);
  }
  revalidateCalendario();
}
