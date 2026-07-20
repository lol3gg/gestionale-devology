import type { Guadagno, Lead, Spesa } from '../types'

export type SortMode = 'data' | 'importo'

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function matchesLeadSearch(lead: Lead, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (lead.nome.toLowerCase().includes(q)) return true

  const phoneQuery = normalizePhone(query)
  if (phoneQuery.length > 0 && normalizePhone(lead.numero).includes(phoneQuery)) {
    return true
  }

  const textFields = [
    lead.note,
    lead.dettagli,
    lead.comeSiamoRimasti,
    lead.servizio,
  ]
  return textFields.some((field) => field.toLowerCase().includes(q))
}

export function getYearMonth(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}` : ''
}

export function matchesMonth(dateStr: string, month: string): boolean {
  if (!month) return true
  return getYearMonth(dateStr) === month
}

export function leadSortValue(lead: Lead): number {
  return lead.valoreProgetto > 0 ? lead.valoreProgetto : lead.prezzoLead
}

export function sortLeads(leads: Lead[], sort: SortMode): Lead[] {
  const copy = [...leads]
  if (sort === 'data') {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } else {
    copy.sort((a, b) => leadSortValue(b) - leadSortValue(a))
  }
  return copy
}

export function sortSpese(spese: Spesa[], sort: SortMode): Spesa[] {
  const copy = [...spese]
  if (sort === 'data') {
    copy.sort((a, b) => b.data.localeCompare(a.data))
  } else {
    copy.sort((a, b) => b.importo - a.importo)
  }
  return copy
}

export function sortGuadagni(guadagni: Guadagno[], sort: SortMode): Guadagno[] {
  const copy = [...guadagni]
  if (sort === 'data') {
    copy.sort((a, b) => b.data.localeCompare(a.data))
  } else {
    copy.sort((a, b) => b.importo - a.importo)
  }
  return copy
}

export function collectMonths(...dateLists: string[][]): string[] {
  const set = new Set<string>()
  for (const dates of dateLists) {
    for (const d of dates) {
      const ym = getYearMonth(d)
      if (ym) set.add(ym)
    }
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

export function currentYearMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
