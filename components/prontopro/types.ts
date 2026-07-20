export type StatoChiamata = 'da_chiamare' | 'chiamato' | 'non_risposto'
export type Esito =
  | 'in_attesa'
  | 'preventivo_inviato'
  | 'chiuso_vinto'
  | 'chiuso_perso'
  | 'non_interessato'

export interface Lead {
  id: string
  nome: string
  numero: string
  prezzoLead: number
  servizio: string
  dettagli: string
  statoChiamata: StatoChiamata
  esito: Esito
  comeSiamoRimasti: string
  valoreProgetto: number
  note: string
  createdAt: string
}

export interface Spesa {
  id: string
  data: string
  importo: number
  nota: string
}

export interface Guadagno {
  id: string
  data: string
  importo: number
  cliente: string
  progetto: string
  nota: string
}

export type LeadInput = Omit<Lead, 'id' | 'createdAt'>
export type SpesaInput = Omit<Spesa, 'id'>
export type GuadagnoInput = Omit<Guadagno, 'id'>
