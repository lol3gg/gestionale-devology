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
