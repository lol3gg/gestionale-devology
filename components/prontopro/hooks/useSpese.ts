import { useCallback } from 'react'
import type { Spesa, SpesaInput } from '../types'
import { loadSpese, saveSpese, STORAGE_KEYS } from '../lib/storage'
import { usePersistentStorage } from './useLocalStorage'

export function useSpese() {
  const [items, setItems] = usePersistentStorage<Spesa[]>({
    load: loadSpese,
    save: saveSpese,
    storageKey: STORAGE_KEYS.spese,
    backupKey: STORAGE_KEYS.speseBackup,
  })

  const add = useCallback(
    (item: SpesaInput) => {
      const spesa: Spesa = { ...item, id: crypto.randomUUID() }
      setItems((prev) => [spesa, ...prev])
    },
    [setItems],
  )

  const update = useCallback(
    (id: string, item: SpesaInput) => {
      setItems((prev) => prev.map((s) => (s.id === id ? { ...item, id } : s)))
    },
    [setItems],
  )

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((s) => s.id !== id))
    },
    [setItems],
  )

  return { items, add, update, remove }
}
