"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StatoRichiesta } from "@/lib/richieste/stato";

export async function updateStato(richiestaId: string, stato: StatoRichiesta) {
  const supabase = createClient();

  const { error } = await supabase.from("richieste").update({ stato }).eq("id", richiestaId);

  if (error) {
    throw new Error(`Impossibile aggiornare lo stato: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${richiestaId}`);
}

export async function updateNoteInterne(richiestaId: string, note: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("richieste")
    .update({ note_interne: note })
    .eq("id", richiestaId);

  if (error) {
    throw new Error(`Impossibile salvare le note: ${error.message}`);
  }

  revalidatePath(`/dashboard/${richiestaId}`);
}
