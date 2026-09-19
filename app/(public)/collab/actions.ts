"use server";

import { revalidatePath } from "next/cache";
import { getCollaboratorePortale } from "@/lib/collaboratori/portale";
import {
  insertContatto,
  insertContattiBulk,
  isDuplicato,
  listContatti,
  patchContatto,
  removeContatto,
  type ContattoInput,
} from "@/lib/collaboratori/contattiStore";
import { parseContattiExcel } from "@/lib/collaboratori/excel";
import { slugNomeCollaboratore } from "@/lib/collaboratori/token";
import type { StatoContatto } from "@/lib/collaboratori/types";

export type PortaleActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function requirePortale(token: string) {
  const collaboratore = await getCollaboratorePortale(token);
  if (!collaboratore) {
    return { ok: false as const, error: "Link non valido o disattivato." };
  }
  return { ok: true as const, collaboratore };
}

function revalidatePortale(nome: string, token: string) {
  revalidatePath(`/collab/${slugNomeCollaboratore(nome)}/${token}`);
  revalidatePath(`/collab/${token}`);
  revalidatePath("/dashboard/collaboratori");
  revalidatePath("/dashboard");
}

export async function addContattoPortale(
  token: string,
  input: ContattoInput
): Promise<PortaleActionResult> {
  const access = await requirePortale(token);
  if (!access.ok) return access;
  try {
    await insertContatto(access.collaboratore.id, input);
    revalidatePortale(access.collaboratore.nome, token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossibile salvare il contatto." };
  }
}

export async function updateStatoContattoPortale(
  token: string,
  id: string,
  stato: StatoContatto,
  extra?: { data_richiamo?: string | null; data_call?: string | null }
): Promise<PortaleActionResult> {
  const access = await requirePortale(token);
  if (!access.ok) return access;
  if (stato === "da_richiamare" && !extra?.data_richiamo) {
    return { ok: false, error: "Indica data e ora del richiamo." };
  }
  if (stato === "call_fissata" && !extra?.data_call) {
    return { ok: false, error: "Indica data e ora della call." };
  }
  try {
    await patchContatto(access.collaboratore.id, id, {
      stato,
      data_richiamo: stato === "da_richiamare" ? extra?.data_richiamo ?? null : null,
      data_call: stato === "call_fissata" ? extra?.data_call ?? null : null,
    });
    revalidatePortale(access.collaboratore.nome, token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossibile aggiornare lo stato." };
  }
}

export async function deleteContattoPortale(token: string, id: string): Promise<PortaleActionResult> {
  const access = await requirePortale(token);
  if (!access.ok) return access;
  try {
    await removeContatto(access.collaboratore.id, id);
    revalidatePortale(access.collaboratore.nome, token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossibile eliminare il contatto." };
  }
}

export async function importContattiPortale(
  token: string,
  formData: FormData
): Promise<{ ok: true; importati: number; duplicati: number } | { ok: false; error: string }> {
  const access = await requirePortale(token);
  if (!access.ok) return access;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Scegli un file Excel (.xlsx)." };
  }
  if (file.size > 4_000_000) {
    return { ok: false, error: "File troppo grande (max 4 MB)." };
  }

  try {
    const parsed = await parseContattiExcel(await file.arrayBuffer());
    if (parsed.length === 0) {
      return { ok: false, error: "Nessuna riga valida. Usa le colonne Nome Azienda, Referente, Telefono, Email, Note." };
    }
    const esistenti = await listContatti(access.collaboratore.id);
    const nuovi: ContattoInput[] = [];
    let duplicati = 0;
    const visti = [...esistenti];
    for (const row of parsed) {
      if (isDuplicato(visti, row)) {
        duplicati += 1;
        continue;
      }
      nuovi.push(row);
      visti.push({
        id: `tmp-${nuovi.length}`,
        collaboratore_id: access.collaboratore.id,
        ...row,
        created_at: "",
        updated_at: "",
      });
    }
    if (nuovi.length > 0) {
      await insertContattiBulk(access.collaboratore.id, nuovi);
    }
    revalidatePortale(access.collaboratore.nome, token);
    return { ok: true, importati: nuovi.length, duplicati };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Impossibile importare il file.",
    };
  }
}
