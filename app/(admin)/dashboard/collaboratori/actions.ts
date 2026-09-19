"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificaLiveSync } from "@/lib/live/sync";
import { importoDovuto } from "@/lib/collaboratori/calcoli";
import { generaTokenCollaboratore } from "@/lib/collaboratori/token";
import { removeCollaboratoreToken, saveCollaboratoreToken } from "@/lib/collaboratori/portale";
import type { TipoCollaboratore } from "@/lib/collaboratori/types";

async function revalidateCollaboratori() {
  await notificaLiveSync();
  revalidatePath("/dashboard/collaboratori");
  revalidatePath("/dashboard/preventivi");
  revalidatePath("/dashboard");
}

export type NuovoCollaboratoreInput = {
  nome: string;
  tipo: TipoCollaboratore;
  contatto: string | null;
  iban: string | null;
  percentuale: number;
  note: string | null;
};

export async function createCollaboratore(input: NuovoCollaboratoreInput) {
  const supabase = createClient();
  const base = {
    nome: input.nome,
    tipo: input.tipo,
    contatto: input.contatto,
    iban: input.iban,
    percentuale: input.percentuale,
    note: input.note,
    attivo: true,
  };

  const withToken = await supabase
    .from("collaboratori")
    .insert({ ...base, token: generaTokenCollaboratore(), link_attivo: true })
    .select("id")
    .single();

  let id = withToken.data?.id ?? null;

  if (withToken.error) {
    if (!/token|link_attivo|schema cache|column/i.test(withToken.error.message)) {
      throw new Error(`Impossibile salvare il collaboratore: ${withToken.error.message}`);
    }
    const fallback = await supabase.from("collaboratori").insert(base).select("id").single();
    if (fallback.error || !fallback.data) {
      throw new Error(`Impossibile salvare il collaboratore: ${fallback.error?.message ?? "errore sconosciuto"}`);
    }
    id = fallback.data.id;
  }

  if (id) {
    try {
      await saveCollaboratoreToken(id, generaTokenCollaboratore({ id, nome: input.nome }), true);
    } catch {
      // Il collaboratore è salvato: il token verrà generato al prossimo caricamento della pagina.
    }
  }
  await revalidateCollaboratori();
}

export async function updateCollaboratore(
  id: string,
  input: Partial<NuovoCollaboratoreInput> & { attivo?: boolean }
) {
  const supabase = createClient();
  const { error } = await supabase.from("collaboratori").update(input).eq("id", id);

  if (error) {
    throw new Error(`Impossibile aggiornare il collaboratore: ${error.message}`);
  }

  await revalidateCollaboratori();
}

export async function deleteCollaboratore(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("collaboratori").delete().eq("id", id);

  if (error) {
    throw new Error(`Impossibile eliminare il collaboratore: ${error.message}`);
  }

  try {
    await removeCollaboratoreToken(id);
  } catch {
    // Collaboratore già eliminato dalla tabella.
  }
  await revalidateCollaboratori();
}

export type NuovoLavoroInput = {
  collaboratore_id: string;
  preventivo_id: string | null;
  cliente: string | null;
  descrizione: string | null;
  prezzo: number;
  percentuale: number;
  data: string;
  note: string | null;
};

export async function createLavoro(input: NuovoLavoroInput) {
  const supabase = createClient();
  const { error } = await supabase.from("collaboratore_lavori").insert({
    collaboratore_id: input.collaboratore_id,
    preventivo_id: input.preventivo_id,
    cliente: input.cliente,
    descrizione: input.descrizione,
    prezzo: input.prezzo,
    percentuale: input.percentuale,
    data: input.data,
    note: input.note,
    importo_pagato: 0,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Questo preventivo è già associato a questo collaboratore.");
    }
    throw new Error(`Impossibile salvare il lavoro: ${error.message}`);
  }

  await revalidateCollaboratori();
}

export async function updateLavoroPercentuale(id: string, percentuale: number) {
  const supabase = createClient();
  const { error } = await supabase.from("collaboratore_lavori").update({ percentuale }).eq("id", id);

  if (error) {
    throw new Error(`Impossibile aggiornare la percentuale: ${error.message}`);
  }

  await revalidateCollaboratori();
}

export async function registraPagamento(id: string, importo: number) {
  const supabase = createClient();
  const { data, error: readError } = await supabase
    .from("collaboratore_lavori")
    .select("importo_pagato, prezzo, percentuale")
    .eq("id", id)
    .single();

  if (readError || !data) {
    throw new Error("Lavoro non trovato.");
  }

  const dovuto = importoDovuto(Number(data.prezzo), Number(data.percentuale));
  const prossimo = Math.min(dovuto, Math.max(0, Number(data.importo_pagato) + importo));

  const { error } = await supabase
    .from("collaboratore_lavori")
    .update({ importo_pagato: prossimo })
    .eq("id", id);

  if (error) {
    throw new Error(`Impossibile registrare il pagamento: ${error.message}`);
  }

  await revalidateCollaboratori();
}

export async function pagaResiduoLavoro(id: string) {
  const supabase = createClient();
  const { data, error: readError } = await supabase
    .from("collaboratore_lavori")
    .select("prezzo, percentuale")
    .eq("id", id)
    .single();

  if (readError || !data) {
    throw new Error("Lavoro non trovato.");
  }

  const dovuto = importoDovuto(Number(data.prezzo), Number(data.percentuale));
  const { error } = await supabase
    .from("collaboratore_lavori")
    .update({ importo_pagato: dovuto })
    .eq("id", id);

  if (error) {
    throw new Error(`Impossibile segnare il pagamento: ${error.message}`);
  }

  await revalidateCollaboratori();
}

export async function pagaTuttoCollaboratore(collaboratoreId: string) {
  const supabase = createClient();
  const { data, error: readError } = await supabase
    .from("collaboratore_lavori")
    .select("id, prezzo, percentuale, importo_pagato")
    .eq("collaboratore_id", collaboratoreId);

  if (readError) {
    throw new Error(`Impossibile leggere i lavori: ${readError.message}`);
  }

  for (const lavoro of data ?? []) {
    const dovuto = importoDovuto(Number(lavoro.prezzo), Number(lavoro.percentuale));
    if (Number(lavoro.importo_pagato) >= dovuto) continue;
    const { error } = await supabase
      .from("collaboratore_lavori")
      .update({ importo_pagato: dovuto })
      .eq("id", lavoro.id);
    if (error) {
      throw new Error(`Impossibile segnare i pagamenti: ${error.message}`);
    }
  }

  await revalidateCollaboratori();
}

export async function deleteLavoro(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("collaboratore_lavori").delete().eq("id", id);

  if (error) {
    throw new Error(`Impossibile eliminare il lavoro: ${error.message}`);
  }

  await revalidateCollaboratori();
}

export type AssegnaCollaboratoreInput = {
  preventivo_id: string;
  collaboratore_id: string | null;
  cliente: string;
  prezzo: number;
  data: string;
};

/** Un preventivo chiuso da un collaboratore: gli spettano prezzo × percentuale. */
export async function assegnaCollaboratoreAPreventivo(input: AssegnaCollaboratoreInput) {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from("collaboratore_lavori")
    .delete()
    .eq("preventivo_id", input.preventivo_id);

  if (deleteError) {
    throw new Error(`Impossibile aggiornare il collaboratore: ${deleteError.message}`);
  }

  if (!input.collaboratore_id) {
    await revalidateCollaboratori();
    return;
  }

  const { data: collaboratore, error: readError } = await supabase
    .from("collaboratori")
    .select("percentuale")
    .eq("id", input.collaboratore_id)
    .single();

  if (readError || !collaboratore) {
    throw new Error("Collaboratore non trovato.");
  }

  const { error } = await supabase.from("collaboratore_lavori").insert({
    collaboratore_id: input.collaboratore_id,
    preventivo_id: input.preventivo_id,
    cliente: input.cliente,
    descrizione: "Preventivo chiuso",
    prezzo: input.prezzo,
    percentuale: Number(collaboratore.percentuale),
    data: input.data,
    importo_pagato: 0,
  });

  if (error) {
    throw new Error(`Impossibile collegare il collaboratore: ${error.message}`);
  }

  await revalidateCollaboratori();
}
