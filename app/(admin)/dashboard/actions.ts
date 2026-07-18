"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractStoragePath } from "@/lib/storage/signedUrl";
import type { StatoRichiesta } from "@/lib/richieste/stato";

const ALLEGATI_BUCKET = "allegati-clienti";
const PREVENTIVI_BUCKET = "preventivi-clienti";

/**
 * Raccoglie i percorsi storage da eliminare: quelli ricavati dagli url salvati
 * in DB, più eventuali file rimasti nella cartella "<richiestaId>/" del bucket
 * (per non lasciare orfani se la riga DB e il file fossero disallineati).
 */
async function collectStoragePaths(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  richiestaId: string,
  storedUrls: string[]
): Promise<string[]> {
  const paths = new Set<string>();

  for (const url of storedUrls) {
    const path = extractStoragePath(bucket, url);
    if (path) paths.add(path);
  }

  const { data: listed } = await supabase.storage.from(bucket).list(richiestaId, {
    limit: 1000,
  });

  for (const item of listed ?? []) {
    if (item.name) paths.add(`${richiestaId}/${item.name}`);
  }

  return Array.from(paths);
}

export type TipoCliente = "privato" | "azienda";

export type RichiestaDatiInput = {
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  tipoCliente: TipoCliente;
  nomeAzienda: string | null;
  partitaIva: string | null;
  descrizioneProgetto: string;
  tipoProgetto: string;
  specificheTecniche: string[];
  budget: number;
  tempistiche: string;
  comeConosciuto: string | null;
};

export async function updateStato(richiestaId: string, stato: StatoRichiesta) {
  const supabase = createClient();

  const { error } = await supabase.from("richieste").update({ stato }).eq("id", richiestaId);

  if (error) {
    throw new Error(`Impossibile aggiornare lo stato: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archivio");
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

export async function updateRichiestaDati(richiestaId: string, dati: RichiestaDatiInput) {
  const supabase = createClient();

  const { error } = await supabase
    .from("richieste")
    .update({
      nome: dati.nome,
      cognome: dati.cognome,
      email: dati.email,
      telefono: dati.telefono,
      tipo_cliente: dati.tipoCliente,
      nome_azienda: dati.tipoCliente === "azienda" ? dati.nomeAzienda : null,
      partita_iva: dati.tipoCliente === "azienda" ? dati.partitaIva : null,
      descrizione_progetto: dati.descrizioneProgetto,
      tipo_progetto: dati.tipoProgetto,
      specifiche_tecniche: dati.specificheTecniche,
      budget: dati.budget,
      tempistiche: dati.tempistiche,
      come_conosciuto: dati.comeConosciuto,
    })
    .eq("id", richiestaId);

  if (error) {
    throw new Error(`Impossibile aggiornare i dati della richiesta: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${richiestaId}`);
}

/**
 * Elimina definitivamente una richiesta: file fisici dai bucket storage,
 * poi riga su "richieste" (allegati e preventivi spariscono via ON DELETE CASCADE).
 * Redirect alla dashboard con messaggio di conferma.
 */
export async function eliminaRichiesta(richiestaId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Devi essere autenticato per eliminare una richiesta.");
  }

  const [{ data: allegati }, { data: preventivi }] = await Promise.all([
    supabase.from("allegati").select("url_file").eq("richiesta_id", richiestaId),
    supabase.from("preventivi").select("url_file").eq("richiesta_id", richiestaId),
  ]);

  const allegatiPaths = await collectStoragePaths(
    supabase,
    ALLEGATI_BUCKET,
    richiestaId,
    (allegati ?? []).map((row) => row.url_file).filter(Boolean)
  );
  const preventiviPaths = await collectStoragePaths(
    supabase,
    PREVENTIVI_BUCKET,
    richiestaId,
    (preventivi ?? []).map((row) => row.url_file).filter(Boolean)
  );

  if (allegatiPaths.length > 0) {
    const { error: allegatiStorageError } = await supabase.storage
      .from(ALLEGATI_BUCKET)
      .remove(allegatiPaths);
    if (allegatiStorageError) {
      throw new Error(
        `Impossibile eliminare i file allegati dallo storage: ${allegatiStorageError.message}`
      );
    }
  }

  if (preventiviPaths.length > 0) {
    const { error: preventiviStorageError } = await supabase.storage
      .from(PREVENTIVI_BUCKET)
      .remove(preventiviPaths);
    if (preventiviStorageError) {
      throw new Error(
        `Impossibile eliminare i file preventivi dallo storage: ${preventiviStorageError.message}`
      );
    }
  }

  const { error: deleteError } = await supabase.from("richieste").delete().eq("id", richiestaId);

  if (deleteError) {
    throw new Error(`Impossibile eliminare la richiesta: ${deleteError.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archivio");
  revalidatePath("/dashboard/preventivi");
  revalidatePath("/dashboard/contabilita");
  redirect("/dashboard?eliminata=1");
}
