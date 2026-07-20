import type { Esito, Lead, LeadInput, StatoChiamata } from '../types'
import { formatDate } from './formatDate'

export { formatDate }

export const STATO_LABELS: Record<StatoChiamata, string> = {
  da_chiamare: 'Da chiamare',
  chiamato: 'Chiamato',
  non_risposto: 'Non risposto',
}

export const ESITO_LABELS: Record<Esito, string> = {
  in_attesa: 'In attesa',
  preventivo_inviato: 'Preventivo inviato',
  chiuso_vinto: 'Chiuso vinto',
  chiuso_perso: 'Chiuso perso',
  non_interessato: 'Annullato',
}

export const STATO_BADGE: Record<StatoChiamata, string> = {
  da_chiamare: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  chiamato: 'bg-brand-accent/15 text-brand-accent-light ring-brand-accent/30',
  non_risposto: 'bg-white/10 text-brand-soft ring-white/15',
}

export const ESITO_BADGE: Record<Esito, string> = {
  in_attesa: 'bg-white/10 text-brand-soft ring-white/15',
  preventivo_inviato: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  chiuso_vinto: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  chiuso_perso: 'bg-brand-accent/15 text-brand-accent-light ring-brand-accent/30',
  non_interessato: 'bg-white/10 text-brand-muted ring-white/10',
}

export function emptyLead(): LeadInput {
  return {
    nome: '',
    numero: '',
    prezzoLead: 0,
    servizio: '',
    dettagli: '',
    statoChiamata: 'da_chiamare',
    esito: 'in_attesa',
    comeSiamoRimasti: '',
    valoreProgetto: 0,
    note: '',
  }
}

export function leadToInput(lead: Lead): LeadInput {
  return {
    nome: lead.nome,
    numero: lead.numero,
    prezzoLead: lead.prezzoLead,
    servizio: lead.servizio,
    dettagli: lead.dettagli,
    statoChiamata: lead.statoChiamata,
    esito: lead.esito,
    comeSiamoRimasti: lead.comeSiamoRimasti,
    valoreProgetto: lead.valoreProgetto,
    note: lead.note,
  }
}

export function formatEuro(n: number): string {
  return `€\u00a0${n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
