import { redirect } from "next/navigation";
import { getCollaboratorePortale } from "@/lib/collaboratori/portale";
import { listContatti } from "@/lib/collaboratori/contattiStore";
import { demoContattiPer } from "@/lib/collaboratori/demoContatti";
import { pathPortaleCollaboratore, slugNomeCollaboratore } from "@/lib/collaboratori/token";
import { PortaleCollaboratore } from "../../_components/PortaleCollaboratore";
import { LinkNonValido } from "../../_components/LinkNonValido";
import type { ContattoCollaboratore } from "@/lib/collaboratori/types";

export const dynamic = "force-dynamic";

function leggiParam(raw: string | string[]) {
  const value = Array.isArray(raw) ? raw.join("") : raw;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PortaleCollaboratorePage({
  params,
}: {
  params: { nome: string; token: string };
}) {
  const token = leggiParam(params.token);
  const collaboratore = await getCollaboratorePortale(token);
  if (!collaboratore) return <LinkNonValido />;

  const slugCorretto = slugNomeCollaboratore(collaboratore.nome);
  if (slugNomeCollaboratore(leggiParam(params.nome)) !== slugCorretto) {
    redirect(pathPortaleCollaboratore(collaboratore.nome, token));
  }

  let contatti: ContattoCollaboratore[] = [];
  try {
    contatti = await listContatti(collaboratore.id);
  } catch {
    contatti = demoContattiPer(collaboratore.id);
  }

  return <PortaleCollaboratore nome={collaboratore.nome} token={token} contatti={contatti} />;
}
