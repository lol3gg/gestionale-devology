import type { Esito, Guadagno, Lead, Spesa, StatoChiamata } from '../types'

/** Non cambiare mai queste chiavi senza una migrazione esplicita. */
export const STORAGE_KEYS = {
  leads: 'prontopro_leads',
  leadsBackup: 'prontopro_leads_backup',
  spese: 'prontopro_spese',
  speseBackup: 'prontopro_spese_backup',
  guadagni: 'prontopro_guadagni',
  guadagniBackup: 'prontopro_guadagni_backup',
  meta: 'prontopro_storage_meta',
} as const

/** Chiavi vecchie migrate automaticamente al primo avvio. */
const LEGACY_KEYS = {
  leads: ['leads', 'dashboard_leads', 'promtopro_leads'],
  spese: ['spese', 'dashboard_spese', 'promtopro_spese'],
  guadagni: ['guadagni', 'dashboard_guadagni', 'promtopro_guadagni'],
} as const

export const STORAGE_VERSION = 1

/** URL di riferimento della sezione nel gestionale. */
export const CANONICAL_APP_URL = '/dashboard/prontopro'

interface StorageMeta {
  version: number
  updatedAt: string
}

const STATI: StatoChiamata[] = ['da_chiamare', 'chiamato', 'non_risposto']
const ESITI: Esito[] = [
  'in_attesa',
  'preventivo_inviato',
  'chiuso_vinto',
  'chiuso_perso',
  'non_interessato',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.replace(',', '.'))
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function asStato(value: unknown): StatoChiamata {
  return STATI.includes(value as StatoChiamata)
    ? (value as StatoChiamata)
    : 'da_chiamare'
}

function asEsito(value: unknown): Esito {
  return ESITI.includes(value as Esito) ? (value as Esito) : 'in_attesa'
}

function safeParse<T>(raw: string | null): T | null {
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function touchMeta(): void {
  const meta: StorageMeta = {
    version: STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
  }
  writeRaw(STORAGE_KEYS.meta, JSON.stringify(meta))
}

export function normalizeLead(raw: unknown): Lead | null {
  if (!isRecord(raw)) return null

  const nome = asString(raw.nome).trim()
  if (!nome) return null

  const id = asString(raw.id) || crypto.randomUUID()

  return {
    id,
    nome,
    numero: asString(raw.numero),
    prezzoLead: asNumber(raw.prezzoLead),
    servizio: asString(raw.servizio),
    dettagli: asString(raw.dettagli),
    statoChiamata: asStato(raw.statoChiamata),
    esito: asEsito(raw.esito),
    comeSiamoRimasti: asString(raw.comeSiamoRimasti),
    valoreProgetto: asNumber(raw.valoreProgetto),
    note: asString(raw.note),
    createdAt: asString(raw.createdAt) || new Date().toISOString(),
  }
}

export function normalizeSpesa(raw: unknown): Spesa | null {
  if (!isRecord(raw)) return null

  const data = asString(raw.data)
  if (!data) return null

  return {
    id: asString(raw.id) || crypto.randomUUID(),
    data,
    importo: asNumber(raw.importo),
    nota: asString(raw.nota),
  }
}

export function normalizeGuadagno(raw: unknown): Guadagno | null {
  if (!isRecord(raw)) return null

  const data = asString(raw.data)
  if (!data) return null

  return {
    id: asString(raw.id) || crypto.randomUUID(),
    data,
    importo: asNumber(raw.importo),
    cliente: asString(raw.cliente),
    progetto: asString(raw.progetto),
    nota: asString(raw.nota),
  }
}

function normalizeArray<T>(
  raw: unknown,
  normalize: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(raw)) return null
  return raw.map(normalize).filter((item): item is T => item !== null)
}

function migrateLegacyKey(primaryKey: string, legacyKeys: readonly string[]): void {
  if (readRaw(primaryKey) !== null) return

  for (const legacyKey of legacyKeys) {
    const legacyRaw = readRaw(legacyKey)
    if (legacyRaw !== null) {
      writeRaw(primaryKey, legacyRaw)
      return
    }
  }
}

function loadArray<T>(
  primaryKey: string,
  backupKey: string,
  normalize: (item: unknown) => T | null,
): { data: T[]; hadStoredData: boolean } {
  const sources = [primaryKey, backupKey]
  let hadStoredData = false

  for (const key of sources) {
    const parsed = safeParse<unknown>(readRaw(key))
    if (parsed === null) continue

    hadStoredData = true
    const normalized = normalizeArray(parsed, normalize)
    if (normalized !== null) {
      persistArray(primaryKey, backupKey, normalized)
      return { data: normalized, hadStoredData: true }
    }
  }

  return { data: [], hadStoredData }
}

export function persistArray<T>(
  primaryKey: string,
  backupKey: string,
  data: T[],
): boolean {
  const serialized = JSON.stringify(data)
  const primaryOk = writeRaw(primaryKey, serialized)
  const backupOk = writeRaw(backupKey, serialized)
  if (primaryOk || backupOk) touchMeta()
  return primaryOk
}

export function initAppStorage(): void {
  migrateLegacyKey(STORAGE_KEYS.leads, LEGACY_KEYS.leads)
  migrateLegacyKey(STORAGE_KEYS.spese, LEGACY_KEYS.spese)
  migrateLegacyKey(STORAGE_KEYS.guadagni, LEGACY_KEYS.guadagni)

  const collections = [
    { primary: STORAGE_KEYS.leads, backup: STORAGE_KEYS.leadsBackup },
    { primary: STORAGE_KEYS.spese, backup: STORAGE_KEYS.speseBackup },
    { primary: STORAGE_KEYS.guadagni, backup: STORAGE_KEYS.guadagniBackup },
  ] as const

  for (const collection of collections) {
    const primaryRaw = readRaw(collection.primary)
    const backupRaw = readRaw(collection.backup)

    if (primaryRaw === null && backupRaw !== null) {
      writeRaw(collection.primary, backupRaw)
    } else if (primaryRaw !== null && backupRaw === null) {
      writeRaw(collection.backup, primaryRaw)
    }

    if (collection.primary === STORAGE_KEYS.leads) {
      const loaded = loadLeads()
      if (loaded.hadStoredData) saveLeads(loaded.data)
    } else if (collection.primary === STORAGE_KEYS.spese) {
      const loaded = loadSpese()
      if (loaded.hadStoredData) saveSpese(loaded.data)
    } else {
      const loaded = loadGuadagni()
      if (loaded.hadStoredData) saveGuadagni(loaded.data)
    }
  }
}

export function loadLeads(): { data: Lead[]; hadStoredData: boolean } {
  return loadArray(STORAGE_KEYS.leads, STORAGE_KEYS.leadsBackup, normalizeLead)
}

export function loadSpese(): { data: Spesa[]; hadStoredData: boolean } {
  return loadArray(STORAGE_KEYS.spese, STORAGE_KEYS.speseBackup, normalizeSpesa)
}

export function loadGuadagni(): { data: Guadagno[]; hadStoredData: boolean } {
  return loadArray(
    STORAGE_KEYS.guadagni,
    STORAGE_KEYS.guadagniBackup,
    normalizeGuadagno,
  )
}

export function saveLeads(data: Lead[]): boolean {
  return persistArray(STORAGE_KEYS.leads, STORAGE_KEYS.leadsBackup, data)
}

export function saveSpese(data: Spesa[]): boolean {
  return persistArray(STORAGE_KEYS.spese, STORAGE_KEYS.speseBackup, data)
}

export function saveGuadagni(data: Guadagno[]): boolean {
  return persistArray(STORAGE_KEYS.guadagni, STORAGE_KEYS.guadagniBackup, data)
}

export function exportAllData(): string {
  const payload = {
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    leads: loadLeads().data,
    spese: loadSpese().data,
    guadagni: loadGuadagni().data,
  }
  return JSON.stringify(payload, null, 2)
}

export function importAllData(json: string): boolean {
  const parsed = safeParse<{
    leads?: unknown
    spese?: unknown
    guadagni?: unknown
  }>(json)
  if (!parsed) return false

  const leads = normalizeArray(parsed.leads ?? [], normalizeLead) ?? []
  const spese = normalizeArray(parsed.spese ?? [], normalizeSpesa) ?? []
  const guadagni = normalizeArray(parsed.guadagni ?? [], normalizeGuadagno) ?? []

  return (
    saveLeads(leads) && saveSpese(spese) && saveGuadagni(guadagni)
  )
}
