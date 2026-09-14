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
  lavori: CollaboratoreLavoro[];
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
