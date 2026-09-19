"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificaLiveSync } from "@/lib/live/sync";
import type { CategoriaMovimento, TipoMovimento } from "@/lib/contabilita/categorie";
import {
  insertCanone,
  patchCanoneAttivo,
  removeCanone,
  type NuovoCanoneInput,
} from "@/lib/contabilita/canoni";

export type NuovoMovimentoInput = {
  tipo: TipoMovimento;
  categoria: CategoriaMovimento;
  descrizione: string;
  importo: number;
  data: string;
  richiesta_id: string | null;
  note: string | null;
};

export async function createMovimento(input: NuovoMovimentoInput) {
  const supabase = createClient();

  const { error } = await supabase.from("movimenti").insert({
    tipo: input.tipo,
    categoria: input.categoria,
    descrizione: input.descrizione,
    importo: input.importo,
    data: input.data,
    richiesta_id: input.richiesta_id,
    note: input.note,
  });

  if (error) {
    throw new Error(`Impossibile salvare il movimento: ${error.message}`);
  }

  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export async function deleteMovimento(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from("movimenti").delete().eq("id", id);

  if (error) {
    throw new Error(`Impossibile eliminare il movimento: ${error.message}`);
  }

  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export type NuovoAbbonamentoInput = {
  nome: string;
  costo_mensile: number;
  categoria: string | null;
  data_inizio: string | null;
  note: string | null;
};

export async function createAbbonamento(input: NuovoAbbonamentoInput) {
  const supabase = createClient();

  const { error } = await supabase.from("abbonamenti").insert({
    nome: input.nome,
    costo_mensile: input.costo_mensile,
    categoria: input.categoria,
    data_inizio: input.data_inizio,
    note: input.note,
    attivo: true,
  });

  if (error) {
    throw new Error(`Impossibile salvare l'abbonamento: ${error.message}`);
  }

  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export async function toggleAbbonamento(id: string, attivo: boolean) {
  const supabase = createClient();

  const { error } = await supabase.from("abbonamenti").update({ attivo }).eq("id", id);

  if (error) {
    throw new Error(`Impossibile aggiornare l'abbonamento: ${error.message}`);
  }

  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export async function deleteAbbonamento(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from("abbonamenti").delete().eq("id", id);

  if (error) {
    throw new Error(`Impossibile eliminare l'abbonamento: ${error.message}`);
  }

  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export async function createCanone(input: NuovoCanoneInput) {
  await insertCanone(createClient(), input);
  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export async function toggleCanone(id: string, attivo: boolean) {
  await patchCanoneAttivo(createClient(), id, attivo);
  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}

export async function deleteCanone(id: string) {
  await removeCanone(createClient(), id);
  await notificaLiveSync();
  revalidatePath("/dashboard/contabilita");
}
