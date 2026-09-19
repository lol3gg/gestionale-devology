export type TipoCollaboratore = "azienda" | "freelancer" | "persona";

export const TIPO_COLLABORATORE_OPTIONS: { value: TipoCollaboratore; label: string }[] = [
  { value: "azienda", label: "Azienda" },
  { value: "freelancer", label: "Freelancer" },
  { value: "persona", label: "Persona" },
];

export function getTipoCollaboratoreLabel(tipo: string) {
  return TIPO_COLLABORATORE_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;
}

export type CollaboratoreLavoro = {
  id: string;
  collaboratore_id: string;
  preventivo_id: string | null;
  cliente: string | null;
  descrizione: string | null;
  prezzo: number;
  percentuale: number;
  importo_pagato: number;
  data: string;
  note: string | null;
  preventivo: {
    id: string;
    nome: string | null;
    cognome: string | null;
    azienda: string | null;
    prezzo: number | null;
    stato: string;
    data_invio: string;
    numero_preventivo: string | null;
  } | null;
};

export type Collaboratore = {
  id: string;
  nome: string;
  tipo: TipoCollaboratore;
  contatto: string | null;
  iban: string | null;
  percentuale: number;
  note: string | null;
  attivo: boolean;
  token: string | null;
  link_attivo: boolean;
  lavori: CollaboratoreLavoro[];
  statsContatti: RiepilogoContatti;
};

export type CollaboratorePortale = {
  id: string;
  nome: string;
  token: string;
};

export const STATI_CONTATTO = [
  "da_chiamare",
  "chiamato",
  "da_richiamare",
  "call_fissata",
  "interessato",
  "non_interessato",
] as const;

export type StatoContatto = (typeof STATI_CONTATTO)[number];

export const STATO_CONTATTO_LABELS: Record<StatoContatto, string> = {
  da_chiamare: "Da chiamare",
  chiamato: "Chiamato",
  da_richiamare: "Da richiamare",
  call_fissata: "Call fissata",
  interessato: "Interessato",
  non_interessato: "Hanno detto no",
};

export const FILTRI_STATO_CONTATTO: { value: "tutti" | StatoContatto; label: string }[] = [
  { value: "tutti", label: "Tutti" },
  { value: "da_chiamare", label: "Da chiamare" },
  { value: "chiamato", label: "Chiamato" },
  { value: "da_richiamare", label: "Da richiamare" },
  { value: "call_fissata", label: "Call fissata" },
  { value: "interessato", label: "Interessati" },
  { value: "non_interessato", label: "Hanno detto no" },
];

export type RiepilogoContatti = {
  numeriPresi: number;
  attivi: number;
  daRichiamare: number;
  hannoDettoNo: number;
  daChiamare: number;
  chiamato: number;
  callFissate: number;
  conversione: number;
};

export function riepilogoContatti(contatti: ContattoCollaboratore[]): RiepilogoContatti {
  const count = (stato: StatoContatto) => contatti.filter((item) => item.stato === stato).length;
  const numeriPresi = contatti.length;
  const attivi = count("interessato");
  return {
    numeriPresi,
    attivi,
    daRichiamare: count("da_richiamare"),
    hannoDettoNo: count("non_interessato"),
    daChiamare: count("da_chiamare"),
    chiamato: count("chiamato"),
    callFissate: count("call_fissata"),
    conversione: numeriPresi ? Math.round((attivi / numeriPresi) * 100) : 0,
  };
}

export type ContattoCollaboratore = {
  id: string;
  collaboratore_id: string;
  nome_azienda: string | null;
  referente: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  stato: StatoContatto;
  data_richiamo: string | null;
  data_call: string | null;
  created_at: string;
  updated_at: string;
};

export function isRichiamoUrgente(contatto: Pick<ContattoCollaboratore, "stato" | "data_richiamo">) {
  if (contatto.stato !== "da_richiamare" || !contatto.data_richiamo) return false;
  return new Date(contatto.data_richiamo).getTime() <= Date.now();
}

export type PreventivoOption = {
  id: string;
  nome: string | null;
  cognome: string | null;
  azienda: string | null;
  prezzo: number | null;
  stato: string;
  data_invio: string;
  numero_preventivo: string | null;
};

export type CollaboratoreOption = {
  id: string;
  nome: string;
  percentuale: number;
  attivo: boolean;
};
