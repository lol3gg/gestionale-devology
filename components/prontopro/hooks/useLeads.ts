import { useCallback } from 'react'
import type { Lead, LeadInput } from '../types'
import { loadLeads, saveLeads, STORAGE_KEYS } from '../lib/storage'
import { usePersistentStorage } from './useLocalStorage'

export function useLeads() {
  const [items, setItems] = usePersistentStorage<Lead[]>({
    load: loadLeads,
    save: saveLeads,
    storageKey: STORAGE_KEYS.leads,
    backupKey: STORAGE_KEYS.leadsBackup,
  })

  const add = useCallback(
    (item: LeadInput) => {
      const lead: Lead = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setItems((prev) => [lead, ...prev])
    },
    [setItems],
  )

  const update = useCallback(
    (id: string, item: LeadInput) => {
      setItems((prev) =>
        prev.map((l) =>
          l.id === id ? { ...item, id, createdAt: l.createdAt } : l,
        ),
      )
    },
    [setItems],
  )

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((l) => l.id !== id))
    },
    [setItems],
  )

  return { items, add, update, remove }
}
